import db from "../config/db.js";
import {
    createAppointment,
    getAppointmentById,
    getAppointmentsByOwner,
    getAppointmentsByVet,
    selectAppointmentSlot,
    resubmitAppointmentRequest,
    updateAppointmentStatus,
    deleteAppointment
} from "../models/Appointment.js";
import { triggerAppointmentNotification } from "./notificationController.js"; //isuri-notification
import { markSlotAsBooked } from "../models/Schedule.js"; //Navindu 2026/06/26 ... markSlotAsBooked

export const bookAppointment = (req, res) => {
    const { pet_owner_id, veterinarian_id, animal_id, reason, availability } = req.body;

    if (!pet_owner_id || !veterinarian_id || !animal_id || !Array.isArray(availability) || availability.length === 0) {
        return res.status(400).json({ message: "Missing required appointment request fields." });
    }

    createAppointment(req.body, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Failed to create appointment request"
            });
        }

        triggerAppointmentNotification(req.app, result.appointmentId, "appointment_requested");//isuri-notification

        res.status(201).json({
            message: "Appointment request submitted successfully",
            data: result
        });
    });
};

export const getOwnerAppointments = (req, res) => {
    const ownerId = req.params.ownerId;

    getAppointmentsByOwner(ownerId, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch appointments"
            });
        }

        res.json(results);
    });
};

export const getAppointment = (req, res) => {
    getAppointmentById(req.params.id, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch appointment"
            });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Group slots from multiple rows
        const appointment = { ...results[0] };
        const slots = [];
        results.forEach(row => {
            if (row.slot_id) {
                slots.push({
                    id: row.slot_id,
                    date: row.slot_date,
                    time: row.slot_time,
                    is_selected: row.is_selected
                });
            }
        });
        appointment.slots = slots;

        // Clean up slot-specific fields from the main object
        delete appointment.slot_id;
        delete appointment.slot_date;
        delete appointment.slot_time;
        delete appointment.is_selected;

        res.json(appointment);
    });
};

export const getVetAppointments = (req, res) => {
    const vetId = req.params.vetId;

    getAppointmentsByVet(vetId, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch appointments"
            });
        }

        res.json(results);
    });
};

//Approve appointment with slot selection AND mark slot as booked
export const approveAppointment = (req, res) => {
    const { id } = req.params;
    const { slotId, appointment_date, appointment_time } = req.body;

    const proceedWithApproval = (targetSlotId) => {
        // First, select the appointment slot
        selectAppointmentSlot(id, targetSlotId, "Approved", (err, result) => {
            if (err) {
                console.error('Error approving appointment:', err);
                return res.status(500).json({
                    message: "Failed to approve appointment: " + err.message
                });
            }

            // Mark the schedule slot as booked
            markSlotAsBooked(targetSlotId, id, (scheduleErr, scheduleResult) => {
                if (scheduleErr) {
                    console.error('Error marking schedule slot as booked:', scheduleErr);
                }

                // Conflict Check
                db.query(
                    `SELECT a.id, s.slot_date, s.slot_time, v.fullName AS vet_name
                     FROM appointments a 
                     JOIN appointment_slots s ON a.selected_slot_id = s.id 
                     JOIN veterinarians v ON a.veterinarian_id = v.id
                     WHERE a.status = 'Approved' 
                       AND a.veterinarian_id = (SELECT veterinarian_id FROM appointments WHERE id = ?)
                       AND a.id != ?
                       AND s.slot_date = (SELECT slot_date FROM appointment_slots WHERE id = ?)
                       AND s.slot_time = (SELECT slot_time FROM appointment_slots WHERE id = ?)`,
                    [id, id, targetSlotId, targetSlotId],
                    (errConflict, conflictResults) => {
                        if (!errConflict && conflictResults && conflictResults.length > 0) {
                            const conflict = conflictResults[0];
                            const io = req.app.get("io");
                            import("../models/Notification.js").then(({ createAdminNotification }) => {
                                createAdminNotification(io, {
                                    type: "appointment_conflict",
                                    title: "Appointment Conflict Detected",
                                    message: `Conflict detected for Dr. ${conflict.vet_name}: overlapping approved appointments (#${id} and #${conflict.id}) on ${new Date(conflict.slot_date).toLocaleDateString()} at ${conflict.slot_time}.`
                                });
                            }).catch(console.error);
                        }
                    }
                );

                // Send notification
                triggerAppointmentNotification(req.app, id, "appointment_confirmed");

                res.json({
                    message: "Appointment approved successfully and slot booked",
                    data: {
                        appointment: result,
                        schedule: scheduleResult || null
                    }
                });
            });
        });
    };

    if (slotId) {
        return proceedWithApproval(slotId);
    }

    // Lookup slotId dynamically by date/time or existing slots
    let lookupSql = "SELECT id FROM appointment_slots WHERE appointment_id = ?";
    let params = [id];

    if (appointment_date && appointment_time) {
        lookupSql += " AND slot_date = ? AND slot_time = ?";
        params.push(appointment_date, appointment_time);
    }

    lookupSql += " ORDER BY id ASC LIMIT 1";

    db.query(lookupSql, params, (err, slotRows) => {
        if (!err && slotRows && slotRows.length > 0) {
            return proceedWithApproval(slotRows[0].id);
        }

        if (appointment_date && appointment_time) {
            db.query("SELECT id FROM appointment_slots WHERE appointment_id = ? ORDER BY id ASC LIMIT 1", [id], (errAny, anySlotRows) => {
                if (!errAny && anySlotRows && anySlotRows.length > 0) {
                    return proceedWithApproval(anySlotRows[0].id);
                }

                const insertSql = "INSERT INTO appointment_slots (appointment_id, slot_date, slot_time, is_selected) VALUES (?, ?, ?, 1)";
                db.query(insertSql, [id, appointment_date, appointment_time], (errIns, insRes) => {
                    if (errIns) {
                        return res.status(400).json({ message: "Slot ID is required for approval: " + errIns.message });
                    }
                    proceedWithApproval(insRes.insertId);
                });
            });
        } else {
            return res.status(400).json({ message: "Slot ID or slot details are required for approval" });
        }
    });
};

export const rejectAppointment = (req, res) => {
    updateAppointmentStatus(
        req.params.id,
        "Rejected",
        (err) => {
            if (err) {
                return res.status(500).json({
                    message: "Failed to reject appointment"
                });
            }

            triggerAppointmentNotification(req.app, req.params.id, "appointment_rejected");

            res.json({
                message: "Appointment rejected"
            });
        }
    );
};

export const resubmitAppointment = (req, res) => {
    const { availability, reason } = req.body;

    if (!Array.isArray(availability) || availability.length === 0) {
        return res.status(400).json({ message: "Availability list is required for resubmission." });
    }

    resubmitAppointmentRequest(req.params.id, { availability, reason }, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to resubmit appointment request"
            });
        }

        triggerAppointmentNotification(req.app, req.params.id, "appointment_rescheduled");

        res.json({
            message: "Appointment request resubmitted successfully",
            data: result
        });
    });
};

export const completeAppointment = (req, res) => {
    updateAppointmentStatus(
        req.params.id,
        "Completed",
        (err) => {
            if (err) {
                return res.status(500).json({
                    message: "Failed to complete appointment"
                });
            }

            triggerAppointmentNotification(req.app, req.params.id, "appointment_completed");

            res.json({
                message: "Appointment completed"
            });
        }
    );
};

export const cancelAppointment = (req, res) => {
    updateAppointmentStatus(
        req.params.id,
        "Cancelled",
        (err) => {
            if (err) {
                return res.status(500).json({
                    message: "Failed to cancel appointment"
                });
            }

            triggerAppointmentNotification(req.app, req.params.id, "appointment_cancelled");

            res.json({
                message: "Appointment cancelled"
            });
        }
    );
};

export const removeAppointment = (req, res) => {
    deleteAppointment(req.params.id, (err) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to delete appointment"
            });
        }

        res.json({
            message: "Appointment deleted"
        });
    });
};

export const getChatHistory = (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT id, sender, sender_name AS senderName, text, file_url AS fileUrl, created_at AS time
        FROM chat_messages 
        WHERE appointment_id = ? 
        ORDER BY created_at ASC
    `;
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Failed to fetch chat history:", err);
            return res.status(500).json({ message: "Failed to fetch chat history" });
        }
        const formattedResults = results.map(msg => ({
            ...msg,
            time: new Date(msg.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }));
        res.json(formattedResults);
    });
};
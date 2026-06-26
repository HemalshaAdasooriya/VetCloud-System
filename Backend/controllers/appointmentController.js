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
    const { slotId } = req.body;

    if (!slotId) {
        return res.status(400).json({ 
            message: "Slot ID is required for approval" 
        });
    }

    // First, select the appointment slot
    selectAppointmentSlot(id, slotId, "Approved", (err, result) => {
        if (err) {
            console.error('Error approving appointment:', err);
            return res.status(500).json({
                message: "Failed to approve appointment: " + err.message
            });
        }

        // Mark the schedule slot as booked
        markSlotAsBooked(slotId, id, (scheduleErr, scheduleResult) => {
            if (scheduleErr) {
                console.error('Error marking schedule slot as booked:', scheduleErr);
                // Still return success for the appointment, but log the error
                // The slot might not exist in the schedule table yet
            }

            //Send notification
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
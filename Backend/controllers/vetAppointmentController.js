import {
    getAppointmentsByVet,
    getAppointmentById,
    getAppointmentSlots as getSlots,
    getAvailableSlots as getAvailable,
    selectAppointmentSlot,
    updateAppointmentStatus,
    completeAppointment as completeApp,
    cancelAppointment as cancelApp,
    deleteAppointment,
    rejectAppointmentWithReason
} from "../models/Appointment.js";
import { triggerAppointmentNotification } from "./notificationController.js"; //isuri-notification
import { markSlotAsBooked } from "../models/Schedule.js"; //Navindu 2026/06/26 ... markSlotAsBooked
import db from "../config/db.js";
import { sendEmail, getMedicalReportTemplate } from "../config/email.js";

// Get all appointments for a veterinarian
export const getVetAppointments = (req, res) => {
    const vetId = req.params.vetId;

    if (!vetId) {
        return res.status(400).json({ message: "Veterinarian ID is required" });
    }

    getAppointmentsByVet(vetId, (err, results) => {
        if (err) {
            console.error('Error fetching vet appointments:', err);
            return res.status(500).json({
                message: "Failed to fetch appointments"
            });
        }

        res.json(results);
    });
};

// Get a single appointment with all details
export const getAppointmentDetails = (req, res) => {
    const { id } = req.params;

    getAppointmentById(id, (err, results) => {
        if (err) {
            console.error('Error fetching appointment:', err);
            return res.status(500).json({
                message: "Failed to fetch appointment"
            });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        res.json(results[0]);
    });
};

// Get all slots for an appointment
export const getAppointmentSlots = (req, res) => {
    const { id } = req.params;

    getSlots(id, (err, results) => {
        if (err) {
            console.error('Error fetching slots:', err);
            return res.status(500).json({
                message: "Failed to fetch appointment slots"
            });
        }

        res.json(results);
    });
};

// Get available slots for an appointment
export const getAvailableSlots = (req, res) => {
    const { id } = req.params;

    getAvailable(id, (err, results) => {
        if (err) {
            console.error('Error fetching available slots:', err);
            return res.status(500).json({
                message: "Failed to fetch available slots"
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

    // 1. Select the appointment slot
    selectAppointmentSlot(id, slotId, "Approved", (err, result) => {
        if (err) {
            console.error('Error approving appointment:', err);
            return res.status(500).json({
                message: "Failed to approve appointment: " + err.message
            });
        }

        // 2. Mark the schedule slot as booked
        markSlotAsBooked(slotId, id, (scheduleErr, scheduleResult) => {
            if (scheduleErr) {
                console.error('Error marking schedule slot as booked:', scheduleErr);
                // Don't fail the request - the appointment is already approved
                // Just log the error and continue
            }

            // 3. Send notification
            triggerAppointmentNotification(req.app, id, "appointment_confirmed");

            // 4. Return success response
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

// Reject appointment with reason
export const rejectAppointment = (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
        return res.status(400).json({ 
            message: "Reason for rejection is required" 
        });
    }

    rejectAppointmentWithReason(id, reason, (err, result) => {
        if (err) {
            console.error('Error rejecting appointment:', err);
            return res.status(500).json({
                message: "Failed to reject appointment: " + err.message
            });
        }

        // Send notification for rejection
        triggerAppointmentNotification(req.app, id, "appointment_rejected");

        res.json({
            message: "Appointment rejected successfully",
            data: result
        });
    });
};

// Complete appointment
export const completeAppointment = (req, res) => {
    const { id } = req.params;
    const { prescription } = req.body;

    completeApp(id, (err, result) => {
        if (err) {
            console.error('Error completing appointment:', err);
            return res.status(500).json({
                message: "Failed to complete appointment"
            });
        }

        // If a prescription text was provided, write it to animal_medical_histories
        if (prescription && prescription.trim() !== "") {
            // First fetch the appointment details to resolve animal_id, veterinarian, and client details
            const aptSql = `
                SELECT 
                    a.animal_id, 
                    v.fullName AS vet_name, 
                    an.name AS animal_name, 
                    po.email AS owner_email, 
                    po.fullName AS owner_name
                FROM appointments a
                JOIN veterinarians v ON a.veterinarian_id = v.id
                JOIN animals an ON a.animal_id = an.id
                JOIN pet_owners po ON a.pet_owner_id = po.id
                WHERE a.id = ?
            `;
            db.query(aptSql, [id], (aptErr, aptResults) => {
                if (!aptErr && aptResults && aptResults.length > 0) {
                    const apt = aptResults[0];
                    const todayStr = new Date().toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    });
                    
                    const historySql = `
                        INSERT INTO animal_medical_histories (animal_id, date, type, title, vet, notes)
                        VALUES (?, ?, 'Prescription', ?, ?, ?)
                    `;
                    const title = `Prescription for Appointment #${id}`;
                    db.query(historySql, [apt.animal_id, todayStr, title, `Dr. ${apt.vet_name}`, prescription], (histErr) => {
                        if (histErr) {
                            console.error("Error creating prescription medical history record:", histErr);
                        } else {
                            console.log(`Prescription medical history record created for animal ${apt.animal_id}`);
                        }
                    });

                    // Send email to owner automatically
                    try {
                        const dateStr = new Date().toLocaleDateString("en-US", {
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric'
                        });
                        const html = getMedicalReportTemplate(
                            apt.owner_name,
                            apt.animal_name,
                            title,
                            "Digital Prescription Report",
                            prescription,
                            `Dr. ${apt.vet_name}`,
                            dateStr
                        );
                        sendEmail({
                            to: apt.owner_email,
                            subject: `Prescription Report: ${apt.animal_name} - Consultation #${id}`,
                            html,
                            text: `Dear ${apt.owner_name}, your prescription report for ${apt.animal_name} is available. Notes: ${prescription}`
                        }).then(() => {
                            console.log(`Email successfully sent to ${apt.owner_email}`);
                        }).catch(emailErr => {
                            console.error("Failed to send automatic prescription email:", emailErr);
                        });
                    } catch (emailErr) {
                        console.error("Failed to automatically email prescription to owner:", emailErr);
                    }
                } else {
                    console.error("Error fetching appointment details for prescription:", aptErr);
                }
            });
        }

        triggerAppointmentNotification(req.app, id, "appointment_completed");
        res.json({
            message: "Appointment completed successfully",
            data: result
        });
    });
};

// Cancel appointment
export const cancelAppointment = (req, res) => {
    const { id } = req.params;

    cancelApp(id, (err, result) => {
        if (err) {
            console.error('Error cancelling appointment:', err);
            return res.status(500).json({
                message: "Failed to cancel appointment"
            });
        }

        triggerAppointmentNotification(req.app, id, "appointment_cancelled");
        res.json({
            message: "Appointment cancelled successfully",
            data: result
        });
    });
};

// Get appointment statistics for vet dashboard
export const getVetAppointmentStats = (req, res) => {
    const vetId = req.params.vetId;

    getAppointmentsByVet(vetId, (err, results) => {
        if (err) {
            console.error('Error fetching appointment stats:', err);
            return res.status(500).json({
                message: "Failed to fetch appointment statistics"
            });
        }

        const stats = {
            total: results.length,
            pending: results.filter(a => a.status === 'Pending').length,
            approved: results.filter(a => a.status === 'Approved').length,
            completed: results.filter(a => a.status === 'Completed').length,
            cancelled: results.filter(a => a.status === 'Cancelled').length,
            rejected: results.filter(a => a.status === 'Rejected').length,
            upcoming: results.filter(a => a.status === 'Approved' && a.appointment_date >= new Date().toISOString().split('T')[0]).length,
            past: results.filter(a => a.status === 'Completed' || a.status === 'Cancelled' || a.status === 'Rejected').length
        };

        res.json(stats);
    });
};
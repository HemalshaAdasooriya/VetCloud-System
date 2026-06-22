import {
    createAppointment,
    getAppointmentById,
    getAppointmentsByOwner,
    getAppointmentsByVet,
    selectAppointmentSlot,  // CHANGED: use this instead of updateAppointmentWithFinalSlot
    resubmitAppointmentRequest,
    updateAppointmentStatus,
    deleteAppointment
} from "../models/Appointment.js";
import { triggerAppointmentNotification } from "./notificationController.js";//isuri-notification

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

        res.json(results[0]);
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

// FIXED: Approve appointment with slot selection
export const approveAppointment = (req, res) => {
    const { slotId } = req.body;

    if (!slotId) {
        return res.status(400).json({ 
            message: "Slot ID is required for approval." 
        });
    }

    selectAppointmentSlot(
        req.params.id,
        slotId,
        "Approved",
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to approve appointment: " + err.message
                });
            }

            triggerAppointmentNotification(req.app, req.params.id, "appointment_confirmed");//isuri-notification
            res.json({
                message: "Appointment approved successfully",
                data: result
            });
        }
    );
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

        triggerAppointmentNotification(req.app, req.params.id, "appointment_rescheduled");//isuri-notification

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

            triggerAppointmentNotification(req.app, req.params.id, "appointment_cancelled");//isuri-notification

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
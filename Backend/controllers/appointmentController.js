
import db from "../config/db.js";
import {
    createAppointment,
    getAppointmentsByOwner,
    getAppointmentsByVet,
    updateAppointmentStatus,
    deleteAppointment
} from "../models/Appointment.js";

export const bookAppointment = (req, res) => {
    createAppointment(req.body, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Failed to create appointment"
            });
        }

        res.status(201).json({
            message: "Appointment booked successfully"
        });
    });
};

export const getOwnerAppointments = (req, res) => {
    const ownerId = req.params.ownerId;

    getAppointmentsByOwner(ownerId, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch appointments"
            });
        }

        res.json(results);
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

export const approveAppointment = (req, res) => {
    updateAppointmentStatus(
        req.params.id,
        "Approved",
        (err) => {
            if (err) {
                return res.status(500).json({
                    message: "Failed to approve appointment"
                });
            }

            res.json({
                message: "Appointment approved"
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
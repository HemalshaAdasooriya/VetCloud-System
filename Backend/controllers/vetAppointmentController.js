import {
    getAppointmentsByVet,
    getAppointmentById,
    getAppointmentSlots as getSlots,
    getAvailableSlots as getAvailable,
    selectAppointmentSlot,
    updateAppointmentStatus,
    completeAppointment as completeApp,
    cancelAppointment as cancelApp,
    deleteAppointment
} from "../models/Appointment.js";

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

// Approve appointment with slot selection
export const approveAppointment = (req, res) => {
    const { id } = req.params;
    const { slotId } = req.body;

    if (!slotId) {
        return res.status(400).json({ 
            message: "Slot ID is required for approval" 
        });
    }

    selectAppointmentSlot(id, slotId, "Approved", (err, result) => {
        if (err) {
            console.error('Error approving appointment:', err);
            return res.status(500).json({
                message: "Failed to approve appointment: " + err.message
            });
        }

        res.json({
            message: "Appointment approved successfully",
            data: result
        });
    });
};

// Reject appointment
export const rejectAppointment = (req, res) => {
    const { id } = req.params;

    updateAppointmentStatus(id, "Rejected", (err, result) => {
        if (err) {
            console.error('Error rejecting appointment:', err);
            return res.status(500).json({
                message: "Failed to reject appointment"
            });
        }

        res.json({
            message: "Appointment rejected successfully",
            data: result
        });
    });
};

// Complete appointment
export const completeAppointment = (req, res) => {
    const { id } = req.params;

    completeApp(id, (err, result) => {
        if (err) {
            console.error('Error completing appointment:', err);
            return res.status(500).json({
                message: "Failed to complete appointment"
            });
        }

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

        res.json({
            message: "Appointment cancelled successfully",
            data: result
        });
    });
};

// Delete appointment
// export const deleteAppointment = (req, res) => {
//     const { id } = req.params;

//     deleteAppointment(id, (err, result) => {
//         if (err) {
//             console.error('Error deleting appointment:', err);
//             return res.status(500).json({
//                 message: "Failed to delete appointment"
//             });
//         }

//         res.json({
//             message: "Appointment deleted successfully",
//             data: result
//         });
//     });
// };

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
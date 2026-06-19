import express from "express";
import {
    getVetAppointments,
    getAppointmentDetails,
    getAppointmentSlots,
    getAvailableSlots,
    approveAppointment,
    rejectAppointment,
    completeAppointment,
    cancelAppointment,
    // deleteAppointment,
    getVetAppointmentStats
} from "../controllers/vetAppointmentController.js";

const vetAppointmentRouter = express.Router();

// Get all appointments for a vet
vetAppointmentRouter.get("/vet/:vetId", getVetAppointments);

// Get appointment statistics
vetAppointmentRouter.get("/vet/:vetId/stats", getVetAppointmentStats);

// Get single appointment details
vetAppointmentRouter.get("/:id", getAppointmentDetails);

// Get all slots for an appointment
vetAppointmentRouter.get("/:id/slots", getAppointmentSlots);

// Get available slots for an appointment
vetAppointmentRouter.get("/:id/available-slots", getAvailableSlots);

// Approve appointment (with slot selection)
vetAppointmentRouter.patch("/:id/approve", approveAppointment);

// Reject appointment
vetAppointmentRouter.patch("/:id/reject", rejectAppointment);

// Complete appointment
vetAppointmentRouter.patch("/:id/complete", completeAppointment);

// Cancel appointment
vetAppointmentRouter.patch("/:id/cancel", cancelAppointment);

// Delete appointment
// vetAppointmentRouter.delete("/:id", deleteAppointment);

export default vetAppointmentRouter;
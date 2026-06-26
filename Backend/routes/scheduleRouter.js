import express from "express";
import {
    getVetScheduleHandler,
    getVetScheduleByDateHandler,
    getVetScheduleByMonthHandler,
    addScheduleSlotHandler,
    addMultipleScheduleSlotsHandler,
    removeScheduleSlotHandler,
    clearDaySlotsHandler,
    updateSlotTypeHandler,
    applyScheduleTemplateHandler,
    // saveScheduleChangesHandler,
    getAvailableSlotsForFarmersHandler
} from "../controllers/scheduleController.js";

const scheduleRouter = express.Router();

// Get schedule
scheduleRouter.get("/vet/:vetId", getVetScheduleHandler);
scheduleRouter.get("/vet/:vetId/date/:date", getVetScheduleByDateHandler);
scheduleRouter.get("/vet/:vetId/month/:year/:month", getVetScheduleByMonthHandler);

// Add slots
scheduleRouter.post("/vet/:vetId/slot", addScheduleSlotHandler);
scheduleRouter.post("/vet/:vetId/slots", addMultipleScheduleSlotsHandler);

// Remove slots
scheduleRouter.delete("/vet/:vetId/slot/:slotId", removeScheduleSlotHandler);
scheduleRouter.delete("/vet/:vetId/day/:date", clearDaySlotsHandler);

// Update slot
scheduleRouter.patch("/vet/:vetId/slot/:slotId", updateSlotTypeHandler);

// Templates
scheduleRouter.post("/vet/:vetId/template", applyScheduleTemplateHandler);

// Save all changes
// scheduleRouter.put("/vet/:vetId/save", saveScheduleChangesHandler);

// Get available slots for farmers
scheduleRouter.get("/vet/:vetId/available/:startDate/:endDate", getAvailableSlotsForFarmersHandler);

export default scheduleRouter;
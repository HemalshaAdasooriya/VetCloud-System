import {
    getVetSchedule,
    getVetScheduleByDate,
    getVetScheduleByMonth,
    addScheduleSlot,
    addMultipleScheduleSlots,
    removeScheduleSlot,
    clearDaySlots,
    updateSlotType,
    markSlotAsBooked,
    getAvailableSlotsForFarmers,
    applyScheduleTemplate
} from "../models/Schedule.js";

// Get all schedule slots for a vet
export const getVetScheduleHandler = (req, res) => {
    const vetId = req.params.vetId;
    
    if (!vetId) {
        return res.status(400).json({ message: "Veterinarian ID is required" });
    }
    
    getVetSchedule(vetId, (err, results) => {
        if (err) {
            console.error('Error fetching schedule:', err);
            return res.status(500).json({ message: "Failed to fetch schedule" });
        }
        res.json(results);
    });
};

// Get schedule for a specific date
export const getVetScheduleByDateHandler = (req, res) => {
    const { vetId, date } = req.params;
    
    if (!vetId || !date) {
        return res.status(400).json({ message: "Veterinarian ID and date are required" });
    }
    
    getVetScheduleByDate(vetId, date, (err, results) => {
        if (err) {
            console.error('Error fetching schedule:', err);
            return res.status(500).json({ message: "Failed to fetch schedule" });
        }
        res.json(results);
    });
};

// Get schedule for a month
export const getVetScheduleByMonthHandler = (req, res) => {
    const { vetId, year, month } = req.params;
    
    if (!vetId || !year || !month) {
        return res.status(400).json({ message: "Veterinarian ID, year, and month are required" });
    }
    
    getVetScheduleByMonth(vetId, parseInt(year), parseInt(month), (err, results) => {
        if (err) {
            console.error('Error fetching schedule:', err);
            return res.status(500).json({ message: "Failed to fetch schedule" });
        }
        res.json(results);
    });
};

// Add a new schedule slot
export const addScheduleSlotHandler = (req, res) => {
    const vetId = req.params.vetId;
    const { slot_date, slot_time, consultation_type } = req.body;
    
    if (!vetId || !slot_date || !slot_time) {
        return res.status(400).json({ message: "Veterinarian ID, date, and time are required" });
    }
    
    addScheduleSlot({
        veterinarian_id: vetId,
        slot_date,
        slot_time,
        consultation_type: consultation_type || 'video'
    }, (err, result) => {
        if (err) {
            console.error('Error adding slot:', err);
            return res.status(500).json({ message: "Failed to add slot" });
        }
        res.status(201).json({
            message: "Slot added successfully",
            data: { id: result.insertId }
        });
    });
};

// Add multiple slots
export const addMultipleScheduleSlotsHandler = (req, res) => {
    const vetId = req.params.vetId;
    const { slots } = req.body;
    
    if (!vetId || !slots || slots.length === 0) {
        return res.status(400).json({ message: "Veterinarian ID and slots are required" });
    }
    
    addMultipleScheduleSlots({
        veterinarian_id: vetId,
        slots: slots
    }, (err, result) => {
        if (err) {
            console.error('Error adding slots:', err);
            return res.status(500).json({ message: "Failed to add slots" });
        }
        res.status(201).json({
            message: "Slots added successfully",
            data: { affectedRows: result.affectedRows }
        });
    });
};

// Remove a schedule slot
export const removeScheduleSlotHandler = (req, res) => {
    const { vetId, slotId } = req.params;
    
    if (!vetId || !slotId) {
        return res.status(400).json({ message: "Veterinarian ID and slot ID are required" });
    }
    
    removeScheduleSlot(slotId, vetId, (err, result) => {
        if (err) {
            console.error('Error removing slot:', err);
            return res.status(500).json({ message: err.message || "Failed to remove slot" });
        }
        res.json({
            message: "Slot removed successfully",
            data: { slotId }
        });
    });
};

// Clear all slots for a day
export const clearDaySlotsHandler = (req, res) => {
    const { vetId, date } = req.params;
    
    if (!vetId || !date) {
        return res.status(400).json({ message: "Veterinarian ID and date are required" });
    }
    
    clearDaySlots(vetId, date, (err, result) => {
        if (err) {
            console.error('Error clearing slots:', err);
            return res.status(500).json({ message: "Failed to clear slots" });
        }
        res.json({
            message: "Slots cleared successfully",
            data: { affectedRows: result.affectedRows }
        });
    });
};

// Update slot consultation type
export const updateSlotTypeHandler = (req, res) => {
    const { vetId, slotId } = req.params;
    const { consultation_type } = req.body;
    
    if (!vetId || !slotId || !consultation_type) {
        return res.status(400).json({ message: "Veterinarian ID, slot ID, and consultation type are required" });
    }
    
    updateSlotType(slotId, vetId, consultation_type, (err, result) => {
        if (err) {
            console.error('Error updating slot:', err);
            return res.status(500).json({ message: "Failed to update slot" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Slot not found or already booked" });
        }
        res.json({
            message: "Slot updated successfully"
        });
    });
};

// Apply schedule template
export const applyScheduleTemplateHandler = (req, res) => {
    const vetId = req.params.vetId;
    const { source_date, target_date } = req.body;
    
    if (!vetId || !source_date || !target_date) {
        return res.status(400).json({ message: "Veterinarian ID, source date, and target date are required" });
    }
    
    applyScheduleTemplate(vetId, source_date, target_date, (err, result) => {
        if (err) {
            console.error('Error applying template:', err);
            return res.status(500).json({ message: "Failed to apply template" });
        }
        res.json({
            message: "Template applied successfully",
            data: result
        });
    });
};

// Get available slots for farmers
export const getAvailableSlotsForFarmersHandler = (req, res) => {
    const { vetId, startDate, endDate } = req.params;
    
    if (!vetId || !startDate || !endDate) {
        return res.status(400).json({ message: "Veterinarian ID, start date, and end date are required" });
    }
    
    getAvailableSlotsForFarmers(vetId, startDate, endDate, (err, results) => {
        if (err) {
            console.error('Error fetching available slots:', err);
            return res.status(500).json({ message: "Failed to fetch available slots" });
        }
        res.json(results);
    });
};
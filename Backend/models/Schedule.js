import db from "../config/db.js";

// Helper to get current timestamp
const getCurrentTimestamp = () => {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
};

// Get all schedule slots for a veterinarian
export const getVetSchedule = (vetId, callback) => {
    const sql = `
        SELECT id, slot_date, slot_time, consultation_type, is_booked, appointment_id
        FROM vet_schedule
        WHERE veterinarian_id = ?
        ORDER BY slot_date ASC, slot_time ASC
    `;
    db.query(sql, [vetId], callback);
};

// Get schedule for a specific date
export const getVetScheduleByDate = (vetId, date, callback) => {
    const sql = `
        SELECT
            id,
            DATE_FORMAT(slot_date, '%Y-%m-%d') AS slot_date,
            slot_time,
            consultation_type,
            is_booked,
            appointment_id
        FROM
            vet_schedule
        WHERE
            veterinarian_id = ?
        AND DATE(slot_date) = ?
        ORDER BY
            slot_time ASC
    `;
    db.query(sql, [vetId, date], callback);
};

// Get schedule for a month
export const getVetScheduleByMonth = (vetId, year, month, callback) => {
    const sql = `
        SELECT id, slot_date, slot_time, consultation_type, is_booked, appointment_id
        FROM vet_schedule
        WHERE veterinarian_id = ? AND YEAR(slot_date) = ? AND MONTH(slot_date) = ?
        ORDER BY slot_date ASC, slot_time ASC
    `;
    db.query(sql, [vetId, year, month], callback);
};

// Add a new schedule slot
export const addScheduleSlot = (data, callback) => {
    const now = getCurrentTimestamp();
    const sql = `
        INSERT INTO vet_schedule 
        (veterinarian_id, slot_date, slot_time, consultation_type, is_booked, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
        sql,
        [
            data.veterinarian_id,
            data.slot_date,
            data.slot_time,
            data.consultation_type || 'video',
            0,
            now,
            now
        ],
        callback
    );
};

// Add multiple schedule slots
export const addMultipleScheduleSlots = (data, callback) => {
    const now = getCurrentTimestamp();
    const sql = `
        INSERT INTO vet_schedule 
        (veterinarian_id, slot_date, slot_time, consultation_type, is_booked, created_at, updated_at)
        VALUES ?
    `;
    const values = data.slots.map(slot => [
        data.veterinarian_id,
        slot.slot_date,
        slot.slot_time,
        slot.consultation_type || 'video',
        0,
        now,
        now
    ]);
    db.query(sql, [values], callback);
};

// Remove a schedule slot
export const removeScheduleSlot = (slotId, vetId, callback) => {
    const checkSql = `SELECT is_booked FROM vet_schedule WHERE id = ? AND veterinarian_id = ?`;
    db.query(checkSql, [slotId, vetId], (err, results) => {
        if (err) return callback(err);
        if (results.length === 0) return callback(new Error('Slot not found'));
        if (results[0].is_booked) {
            return callback(new Error('Cannot remove a booked slot'));
        }
        
        const sql = `DELETE FROM vet_schedule WHERE id = ? AND veterinarian_id = ?`;
        db.query(sql, [slotId, vetId], callback);
    });
};

// Clear all slots for a specific day
export const clearDaySlots = (vetId, date, callback) => {
    const sql = `
        DELETE FROM vet_schedule 
        WHERE veterinarian_id = ? AND slot_date = ? AND is_booked = 0
    `;
    db.query(sql, [vetId, date], callback);
};

// Update slot consultation type
export const updateSlotType = (slotId, vetId, consultationType, callback) => {
    const now = getCurrentTimestamp();
    const sql = `
        UPDATE vet_schedule 
        SET consultation_type = ?, updated_at = ?
        WHERE id = ? AND veterinarian_id = ? AND is_booked = 0
    `;
    db.query(sql, [consultationType, now, slotId, vetId], callback);
};

// Mark a slot as booked (when appointment is approved)
export const markSlotAsBooked = (slotId, appointmentId, callback) => {
    const now = getCurrentTimestamp();
    const sql = `
        UPDATE vet_schedule 
        SET is_booked = 1, appointment_id = ?, updated_at = ?
        WHERE id = ? AND is_booked = 0
    `;
    db.query(sql, [appointmentId, now, slotId], (err, result) => {
        if (err) {
            console.error('SQL Error in markSlotAsBooked:', err);
            return callback(err);
        }
        if (result.affectedRows === 0) {
            return callback(new Error('Slot not found or already booked'));
        }
        callback(null, { slotId, appointmentId, is_booked: 1 });
    });
};

// Get available slots for a date range (for farmers)
export const getAvailableSlotsForFarmers = (vetId, startDate, endDate, callback) => {
    const sql = `
        SELECT id, slot_date, slot_time, consultation_type
        FROM vet_schedule
        WHERE veterinarian_id = ? 
        AND slot_date BETWEEN ? AND ?
        AND is_booked = 0
        ORDER BY slot_date ASC, slot_time ASC
    `;
    db.query(sql, [vetId, startDate, endDate], callback);
};

// Apply template (copy slots from previous week)
export const applyScheduleTemplate = (vetId, sourceDate, targetDate, callback) => {
    const now = getCurrentTimestamp();
    const getSql = `
        SELECT slot_time, consultation_type
        FROM vet_schedule
        WHERE veterinarian_id = ? AND slot_date = ? AND is_booked = 0
    `;
    db.query(getSql, [vetId, sourceDate], (err, results) => {
        if (err) return callback(err);
        if (results.length === 0) {
            return callback(null, { message: 'No slots to copy from this date' });
        }
        
        const values = results.map(row => [
            vetId,
            targetDate,
            row.slot_time,
            row.consultation_type,
            0,
            now,
            now
        ]);
        const insertSql = `
            INSERT INTO vet_schedule 
            (veterinarian_id, slot_date, slot_time, consultation_type, is_booked, created_at, updated_at)
            VALUES ?
        `;
        db.query(insertSql, [values], callback);
    });
};
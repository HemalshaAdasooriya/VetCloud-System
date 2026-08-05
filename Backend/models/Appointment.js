import db from "../config/db.js";

// Helper function to format reason with notes and availability
const formatReasonPayload = (reason, availability) => {
    const payload = {
        notes: reason || "",
        availability: Array.isArray(availability) ? availability : []
    };
    return JSON.stringify(payload);
};

// Helper to parse reason field
const parseReasonField = (reasonStr) => {
    if (!reasonStr) return { notes: '', availability: [] };
    
    try {
        const parsed = JSON.parse(reasonStr);
        if (parsed && typeof parsed === 'object') {
            return {
                notes: parsed.notes || '',
                availability: Array.isArray(parsed.availability) ? parsed.availability : []
            };
        }
    } catch {
        // Not JSON, treat as plain text notes
    }
    
    return { notes: reasonStr, availability: [] };
};

// Create a new appointment with multiple time slots
export const createAppointment = (data, callback) => {
    const sql = `
        INSERT INTO appointments
        (pet_owner_id, veterinarian_id, animal_id, consultation_type, reason, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            data.pet_owner_id,
            data.veterinarian_id,
            data.animal_id,
            data.consultation_type || 'video',
            data.reason || null,
            'Pending'
        ],
        (err, result) => {
            if (err) return callback(err);

            const appointmentId = result.insertId;
            const slots = data.availability.map(slot => [
                appointmentId,
                slot.date,
                slot.time,
                0
            ]);

            db.query(
                'INSERT INTO appointment_slots (appointment_id, slot_date, slot_time, is_selected) VALUES ?',
                [slots],
                (err, slotResult) => {
                    if (err) return callback(err);
                    callback(null, { appointmentId, slotsInserted: slots.length });
                }
            );
        }
    );
};

// Select a specific slot and update appointment status
export const selectAppointmentSlot = (
    appointmentId,
    slotId,
    status,
    callback
) => {
    db.beginTransaction((err) => {
        if (err) return callback(err);

        const finishAppointmentUpdate = () => {
            const updateAppointmentSql = `
                UPDATE appointments
                SET selected_slot_id = ?, status = ?
                WHERE id = ?
            `;

            db.query(updateAppointmentSql, [slotId, status, appointmentId], (err) => {
                if (err) {
                    return db.rollback(() => callback(err));
                }

                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => callback(err));
                    }
                    callback(null, { appointmentId, slotId, status });
                });
            });
        };

        const updateSlotSql = `
            UPDATE appointment_slots
            SET is_selected = 1
            WHERE id = ? AND appointment_id = ?
        `;

        db.query(updateSlotSql, [slotId, appointmentId], (err, result) => {
            if (err) {
                return db.rollback(() => callback(err));
            }

            if (!result || result.affectedRows === 0) {
                // Fallback: try updating by slotId alone or associating slotId with appointmentId
                const fallbackSlotSql = `
                    UPDATE appointment_slots
                    SET is_selected = 1, appointment_id = ?
                    WHERE id = ?
                `;
                db.query(fallbackSlotSql, [appointmentId, slotId], () => {
                    finishAppointmentUpdate();
                });
            } else {
                finishAppointmentUpdate();
            }
        });
    });
};

// 🔥 NEW: Reject appointment with reason
export const rejectAppointmentWithReason = (appointmentId, reason, callback) => {
    db.beginTransaction((err) => {
        if (err) return callback(err);

        // Update status to Rejected and store rejection reason
        const updateSql = `
            UPDATE appointments
            SET status = 'Rejected', rejection_reason = ?
            WHERE id = ?
        `;

        db.query(updateSql, [reason, appointmentId], (err) => {
            if (err) {
                return db.rollback(() => callback(err));
            }

            db.commit((err) => {
                if (err) {
                    return db.rollback(() => callback(err));
                }
                callback(null, { 
                    appointmentId, 
                    status: 'Rejected',
                    reason: reason 
                });
            });
        });
    });
};

// Resubmit appointment request with new reason and availability
export const resubmitAppointmentRequest = (
    appointmentId,
    data,
    callback
) => {
    db.beginTransaction((err) => {
        if (err) return callback(err);

        const updateAppointmentSql = `
            UPDATE appointments
            SET reason = ?, status = 'Pending', selected_slot_id = NULL
            WHERE id = ?
        `;

        db.query(
            updateAppointmentSql,
            [formatReasonPayload(data.reason, data.availability), appointmentId],
            (err, result) => {
                if (err) {
                    return db.rollback(() => callback(err));
                }

                const deleteSlotsSql = `
                    DELETE FROM appointment_slots
                    WHERE appointment_id = ?
                `;

                db.query(deleteSlotsSql, [appointmentId], (err) => {
                    if (err) {
                        return db.rollback(() => callback(err));
                    }

                    const slots = data.availability.map(slot => [
                        appointmentId,
                        slot.date,
                        slot.time,
                        0
                    ]);

                    db.query(
                        'INSERT INTO appointment_slots (appointment_id, slot_date, slot_time, is_selected) VALUES ?',
                        [slots],
                        (err) => {
                            if (err) {
                                return db.rollback(() => callback(err));
                            }

                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => callback(err));
                                }
                                callback(null, { appointmentId, slotsInserted: slots.length });
                            });
                        }
                    );
                });
            }
        );
    });
};

// Get all appointments for a pet owner
export const getAppointmentsByOwner = (ownerId, callback) => {
    const sql = `
        SELECT
            a.*,
            an.name AS animal_name,
            an.breed AS animal_breed,
            an.age AS animal_age,
            an.image AS animal_image,
            an.species AS animal_species,
            v.fullName AS veterinarian_name,
            s.slot_date AS appointment_date,
            s.slot_time AS appointment_time,
            s.id AS selected_slot_id,
            s.is_selected,
            h.notes AS prescription
        FROM appointments a
        JOIN animals an ON a.animal_id = an.id
        JOIN veterinarians v ON a.veterinarian_id = v.id
        LEFT JOIN appointment_slots s ON a.selected_slot_id = s.id
        LEFT JOIN animal_medical_histories h ON h.animal_id = a.animal_id AND h.type = 'Prescription' AND h.title = CONCAT('Prescription for Appointment #', a.id)
        WHERE a.pet_owner_id = ?
        ORDER BY a.created_at DESC
    `;

    db.query(sql, [ownerId], (err, results) => {
        if (err) return callback(err);
        
        const formattedResults = results.map(row => {
            const parsedReason = parseReasonField(row.reason);
            return {
                ...row,
                animal_breed: row.animal_breed || 'Unknown',
                animal_age: row.animal_age || 'N/A',
                animal_image: row.animal_image || '/default.jpg',
                appointment_date: row.appointment_date || null,
                appointment_time: row.appointment_time || null,
                reason_notes: parsedReason.notes,
                availability_slots: parsedReason.availability,
                prescription: row.prescription || null
            };
        });
        
        callback(null, formattedResults);
    });
};

// Get all appointments for a veterinarian
export const getAppointmentsByVet = (vetId, callback) => {
    const sql = `
        SELECT
            a.*,
            p.fullName AS owner_name,
            p.contact_No AS owner_contact,
            an.name AS animal_name,
            an.breed AS animal_breed,
            an.age AS animal_age,
            an.image AS animal_image,
            an.species AS animal_species,
            s.slot_date AS appointment_date,
            s.slot_time AS appointment_time,
            s.id AS selected_slot_id,
            s.is_selected
        FROM appointments a
        JOIN pet_owners p ON a.pet_owner_id = p.id
        JOIN animals an ON a.animal_id = an.id
        LEFT JOIN appointment_slots s ON a.selected_slot_id = s.id
        WHERE a.veterinarian_id = ?
        ORDER BY a.created_at DESC
    `;

    db.query(sql, [vetId], (err, results) => {
        if (err) return callback(err);
        
        const formattedResults = results.map(row => {
            const parsedReason = parseReasonField(row.reason);
            return {
                ...row,
                animal_breed: row.animal_breed || 'Unknown',
                animal_age: row.animal_age || 'N/A',
                animal_image: row.animal_image || '/default.jpg',
                owner_contact: row.owner_contact || '',
                appointment_date: row.appointment_date || null,
                appointment_time: row.appointment_time || null,
                reason_notes: parsedReason.notes,
                availability_slots: parsedReason.availability,
                rejection_reason: row.rejection_reason || null // Include rejection reason
            };
        });
        
        callback(null, formattedResults);
    });
};

// Get a single appointment by ID with all slots
export const getAppointmentById = (appointmentId, callback) => {
    const sql = `
        SELECT
            a.*,
            s.id AS slot_id,
            s.slot_date,
            s.slot_time,
            s.is_selected
        FROM appointments a
        LEFT JOIN appointment_slots s ON a.id = s.appointment_id
        WHERE a.id = ?
        ORDER BY s.slot_date ASC, s.slot_time ASC
    `;

    db.query(sql, [appointmentId], callback);
};

// Update appointment status only
export const updateAppointmentStatus = (
    appointmentId,
    status,
    callback
) => {
    const sql = `
        UPDATE appointments
        SET status = ?
        WHERE id = ?
    `;

    db.query(sql, [status, appointmentId], callback);
};

// Update consultation type
export const updateConsultationType = (
    appointmentId,
    consultationType,
    callback
) => {
    const sql = `
        UPDATE appointments
        SET consultation_type = ?
        WHERE id = ?
    `;

    db.query(sql, [consultationType, appointmentId], callback);
};

// Delete appointment and all associated slots
export const deleteAppointment = (
    appointmentId,
    callback
) => {
    db.query(
        "DELETE FROM appointments WHERE id = ?",
        [appointmentId],
        callback
    );
};

// Get all slots for a specific appointment
export const getAppointmentSlots = (appointmentId, callback) => {
    const sql = `
        SELECT id, slot_date, slot_time, is_selected
        FROM appointment_slots
        WHERE appointment_id = ?
        ORDER BY slot_date ASC, slot_time ASC
    `;

    db.query(sql, [appointmentId], callback);
};

// Get available slots (not selected) for an appointment
export const getAvailableSlots = (appointmentId, callback) => {
    const sql = `
        SELECT id, slot_date, slot_time
        FROM appointment_slots
        WHERE appointment_id = ? AND is_selected = 0
        ORDER BY slot_date ASC, slot_time ASC
    `;

    db.query(sql, [appointmentId], callback);
};

// Cancel appointment (set status to 'Cancelled')
export const cancelAppointment = (appointmentId, callback) => {
    const sql = `
        UPDATE appointments
        SET status = 'Cancelled'
        WHERE id = ?
    `;

    db.query(sql, [appointmentId], callback);
};

// Complete appointment (set status to 'Completed')
export const completeAppointment = (appointmentId, callback) => {
    const sql = `
        UPDATE appointments
        SET status = 'Completed'
        WHERE id = ?
    `;

    db.query(sql, [appointmentId], callback);
};
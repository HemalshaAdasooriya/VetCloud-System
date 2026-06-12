import db from "../config/db.js";

export const createAppointment = (data, callback) => {
    const sql = `
        INSERT INTO appointments
        (
            pet_owner_id,
            veterinarian_id,
            animal_id,
            appointment_date,
            appointment_time,
            reason
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            data.pet_owner_id,
            data.veterinarian_id,
            data.animal_id,
            data.appointment_date,
            data.appointment_time,
            data.reason
        ],
        callback
    );
};

export const getAppointmentsByOwner = (ownerId, callback) => {
    const sql = `
        SELECT
            a.*,
            an.name AS animal_name,
            v.fullName AS veterinarian_name
        FROM appointments a
        JOIN animals an ON a.animal_id = an.id
        JOIN veterinarians v ON a.veterinarian_id = v.id
        WHERE a.pet_owner_id = ?
        ORDER BY a.appointment_date DESC
    `;

    db.query(sql, [ownerId], callback);
};

export const getAppointmentsByVet = (vetId, callback) => {
    const sql = `
        SELECT
            a.*,
            p.fullName AS owner_name,
            an.name AS animal_name
        FROM appointments a
        JOIN pet_owners p ON a.pet_owner_id = p.id
        JOIN animals an ON a.animal_id = an.id
        WHERE a.veterinarian_id = ?
        ORDER BY a.appointment_date DESC
    `;

    db.query(sql, [vetId], callback);
};

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
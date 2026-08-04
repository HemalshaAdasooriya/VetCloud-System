import db from "../config/db.js";

// Initialize tables on startup
export const initializeNotificationTables = () => {
    const createNotificationsTable = `
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            user_role VARCHAR(50) NOT NULL,
            type VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createVaccinationSchedulesTable = `
        CREATE TABLE IF NOT EXISTS vaccination_schedules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            animal_id INT NOT NULL,
            vaccine_name VARCHAR(255) NOT NULL,
            due_date DATE NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_animal_id (animal_id),
            CONSTRAINT fk_vaccination_animal FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createSentRemindersTable = `
        CREATE TABLE IF NOT EXISTS sent_reminders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            entity_type VARCHAR(50) NOT NULL,
            entity_id INT NOT NULL,
            reminder_type VARCHAR(100) NOT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_reminder (entity_type, entity_id, reminder_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createComplaintsTable = `
        CREATE TABLE IF NOT EXISTS complaints (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            user_role VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createSystemErrorsTable = `
        CREATE TABLE IF NOT EXISTS system_errors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            error_code VARCHAR(100) NOT NULL,
            message TEXT NOT NULL,
            severity VARCHAR(50) DEFAULT 'High',
            resolved TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createSystemBackupsTable = `
        CREATE TABLE IF NOT EXISTS system_backups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            backup_name VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'Success',
            file_size VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createSystemMaintenanceTable = `
        CREATE TABLE IF NOT EXISTS system_maintenance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            scheduled_time DATETIME NOT NULL,
            duration_mins INT NOT NULL,
            status VARCHAR(50) DEFAULT 'Scheduled',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createLicensesSubscriptionsTable = `
        CREATE TABLE IF NOT EXISTS licenses_subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            entity_type VARCHAR(50) NOT NULL,
            entity_id INT NOT NULL,
            license_or_sub_name VARCHAR(255) NOT NULL,
            expiry_date DATE NOT NULL,
            status VARCHAR(50) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createChatMessagesTable = `
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            appointment_id INT NOT NULL,
            sender VARCHAR(50) NOT NULL,
            sender_name VARCHAR(255) NOT NULL,
            text TEXT,
            file_url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_appointment_id (appointment_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    db.query(createNotificationsTable, (err) => {
        if (err) console.error("Error creating notifications table:", err);
        else console.log("MySQL 'notifications' table verified.");
    });

    db.query(createVaccinationSchedulesTable, (err) => {
        if (err) console.error("Error creating vaccination_schedules table:", err);
        else console.log("MySQL 'vaccination_schedules' table verified.");
    });

    db.query(createSentRemindersTable, (err) => {
        if (err) console.error("Error creating sent_reminders table:", err);
        else console.log("MySQL 'sent_reminders' table verified.");
    });

    db.query(createComplaintsTable, (err) => {
        if (err) console.error("Error creating complaints table:", err);
        else console.log("MySQL 'complaints' table verified.");
    });

    db.query(createSystemErrorsTable, (err) => {
        if (err) console.error("Error creating system_errors table:", err);
        else console.log("MySQL 'system_errors' table verified.");
    });

    db.query(createSystemBackupsTable, (err) => {
        if (err) console.error("Error creating system_backups table:", err);
        else console.log("MySQL 'system_backups' table verified.");
    });

    db.query(createSystemMaintenanceTable, (err) => {
        if (err) console.error("Error creating system_maintenance table:", err);
        else console.log("MySQL 'system_maintenance' table verified.");
    });

    db.query(createLicensesSubscriptionsTable, (err) => {
        if (err) console.error("Error creating licenses_subscriptions table:", err);
        else console.log("MySQL 'licenses_subscriptions' table verified.");
    });

    db.query(createChatMessagesTable, (err) => {
        if (err) console.error("Error creating chat_messages table:", err);
        else console.log("MySQL 'chat_messages' table verified.");
    });
};

// Create a notification
export const createNotification = (data, callback) => {
    const sql = `
        INSERT INTO notifications (user_id, user_role, type, title, message)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(
        sql,
        [data.userId, data.userRole, data.type, data.title, data.message],
        (err, result) => {
            if (err) return callback(err);
            // Fetch and return the newly created notification
            db.query("SELECT * FROM notifications WHERE id = ?", [result.insertId], (err2, rows) => {
                if (err2) return callback(err2);
                callback(null, rows[0]);
            });
        }
    );
};

// Get notifications for a user
export const getNotificationsByUser = (userId, userRole, callback) => {
    const sql = `
        SELECT * FROM notifications
        WHERE user_id = ? AND user_role = ?
        ORDER BY created_at DESC
        LIMIT 50
    `;
    db.query(sql, [userId, userRole], callback);
};

// Mark notification as read
export const markAsRead = (notificationId, userId, userRole, callback) => {
    const sql = `
        UPDATE notifications
        SET is_read = 1
        WHERE id = ? AND user_id = ? AND user_role = ?
    `;
    db.query(sql, [notificationId, userId, userRole], callback);
};

// Mark all notifications as read
export const markAllAsRead = (userId, userRole, callback) => {
    const sql = `
        UPDATE notifications
        SET is_read = 1
        WHERE user_id = ? AND user_role = ?
    `;
    db.query(sql, [userId, userRole], callback);
};

// Get vaccination schedules for an owner's animals
export const getVaccinationSchedulesByOwner = (ownerId, callback) => {
    const sql = `
        SELECT vs.*, a.name AS animal_name, a.species AS animal_species, a.breed AS animal_breed
        FROM vaccination_schedules vs
        JOIN animals a ON vs.animal_id = a.id
        WHERE a.owner_id = ?
        ORDER BY vs.due_date ASC
    `;
    db.query(sql, [ownerId], callback);
};

// Create a vaccination schedule
export const createVaccinationSchedule = (data, callback) => {
    const sql = `
        INSERT INTO vaccination_schedules (animal_id, vaccine_name, due_date, status)
        VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [data.animalId, data.vaccineName, data.dueDate, data.status || 'Pending'], (err, result) => {
        if (err) return callback(err);
        db.query("SELECT vs.*, a.name AS animal_name FROM vaccination_schedules vs JOIN animals a ON vs.animal_id = a.id WHERE vs.id = ?", [result.insertId], (err2, rows) => {
            if (err2) return callback(err2);
            callback(null, rows[0]);
        });
    });
};

// Mark vaccination as administered
export const markVaccinationAdministered = (scheduleId, callback) => {
    const sql = `
        UPDATE vaccination_schedules
        SET status = 'Administered'
        WHERE id = ?
    `;
    db.query(sql, [scheduleId], callback);
};

// Query upcoming reminders that need notifications sent:
// 1. Appointments starting in ~1 day (23 to 25 hours from now)
// 2. Appointments starting in ~1 hour (50 to 70 minutes from now)
// 3. Vaccinations due in 7 days (due date is exactly 7 days from now)
export const getUpcomingReminders = (callback) => {
    const reminders = {
        appointments1Day: [],
        appointments1Hour: [],
        vaccinations7Days: []
    };

    // Query 1 & 2: Appointments
    const appointmentSql = `
        SELECT 
            a.id AS appointment_id,
            a.pet_owner_id,
            a.veterinarian_id,
            a.animal_id,
            a.consultation_type,
            an.name AS animal_name,
            po.fullName AS owner_name,
            po.email AS owner_email,
            v.fullName AS vet_name,
            v.email AS vet_email,
            s.slot_date,
            s.slot_time,
            TIMESTAMPDIFF(MINUTE, NOW(), CONCAT(s.slot_date, ' ', s.slot_time)) AS mins_left
        FROM appointments a
        JOIN appointment_slots s ON a.selected_slot_id = s.id
        JOIN animals an ON a.animal_id = an.id
        JOIN pet_owners po ON a.pet_owner_id = po.id
        JOIN veterinarians v ON a.veterinarian_id = v.id
        WHERE a.status = 'Approved'
    `;

    db.query(appointmentSql, (err, appts) => {
        if (err) return callback(err);

        appts.forEach(apt => {
            // 23 to 25 hours is 1380 to 1500 minutes
            if (apt.mins_left >= 1380 && apt.mins_left <= 1500) {
                reminders.appointments1Day.push(apt);
            }
            // 50 to 70 minutes
            if (apt.mins_left >= 50 && apt.mins_left <= 70) {
                reminders.appointments1Hour.push(apt);
            }
        });

        // Query 3: Vaccinations due in 7 days (date diff = 7)
        const vaccineSql = `
            SELECT 
                vs.id AS schedule_id,
                vs.vaccine_name,
                vs.due_date,
                a.id AS animal_id,
                a.name AS animal_name,
                a.owner_id AS pet_owner_id,
                po.fullName AS owner_name,
                po.email AS owner_email
            FROM vaccination_schedules vs
            JOIN animals a ON vs.animal_id = a.id
            JOIN pet_owners po ON a.owner_id = po.id
            WHERE vs.status = 'Pending' AND DATEDIFF(vs.due_date, CURRENT_DATE()) BETWEEN 6 AND 8
        `;

        db.query(vaccineSql, (err2, vacs) => {
            if (err2) return callback(err2);
            reminders.vaccinations7Days = vacs;
            callback(null, reminders);
        });
    });
};

// Log a sent reminder to prevent duplicates
export const logSentReminder = (entityType, entityId, reminderType, callback) => {
    const sql = `
        INSERT IGNORE INTO sent_reminders (entity_type, entity_id, reminder_type)
        VALUES (?, ?, ?)
    `;
    db.query(sql, [entityType, entityId, reminderType], callback);
};

// Check if a reminder was already sent
export const isReminderSent = (entityType, entityId, reminderType, callback) => {
    const sql = `
        SELECT id FROM sent_reminders
        WHERE entity_type = ? AND entity_id = ? AND reminder_type = ?
    `;
    db.query(sql, [entityType, entityId, reminderType], (err, results) => {
        if (err) return callback(err);
        callback(null, results.length > 0);
    });
};

// ========================================================
// ADMIN SYSTEM NOTIFICATIONS AND SIMULATION CRUD DATA
// ========================================================

// Fetch all active admin ids
export const getAllAdminIds = (callback) => {
    db.query("SELECT id FROM admins", (err, results) => {
        if (err) return callback(err);
        callback(null, results.map(r => r.id));
    });
};

// Insert a notification for all admin users and push via socket
export const createAdminNotification = (io, data, callback) => {
    getAllAdminIds((err, adminIds) => {
        if (err) {
            console.error("Failed to query admin IDs:", err);
            if (callback) callback(err);
            return;
        }
        
        // If there are no admins in the DB, mock it with ID 1
        const ids = adminIds.length > 0 ? adminIds : [1];
        let completed = 0;
        const results = [];
        
        ids.forEach(adminId => {
            const notifyData = {
                userId: adminId,
                userRole: "admin",
                type: data.type,
                title: data.title,
                message: data.message
            };
            
            createNotification(notifyData, (errNotify, dbNotify) => {
                if (!errNotify && dbNotify) {
                    results.push(dbNotify);
                    if (io) {
                        io.to(`admin_${adminId}`).emit("new-notification", dbNotify);
                    }
                }
                completed++;
                if (completed === ids.length) {
                    if (callback) callback(null, results);
                }
            });
        });
    });
};

// Complaints
export const createComplaint = (data, callback) => {
    const sql = `
        INSERT INTO complaints (user_id, user_role, title, description)
        VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [data.userId, data.userRole, data.title, data.description], (err, result) => {
        if (err) return callback(err);
        db.query("SELECT * FROM complaints WHERE id = ?", [result.insertId], (err2, rows) => {
            if (err2) return callback(err2);
            callback(null, rows[0]);
        });
    });
};

export const getComplaints = (callback) => {
    db.query("SELECT * FROM complaints ORDER BY created_at DESC", callback);
};

export const resolveComplaint = (id, callback) => {
    db.query("UPDATE complaints SET status = 'Resolved' WHERE id = ?", [id], callback);
};

// System Errors
export const createSystemError = (data, callback) => {
    const sql = `
        INSERT INTO system_errors (error_code, message, severity)
        VALUES (?, ?, ?)
    `;
    db.query(sql, [data.errorCode, data.message, data.severity || 'High'], (err, result) => {
        if (err) return callback(err);
        db.query("SELECT * FROM system_errors WHERE id = ?", [result.insertId], (err2, rows) => {
            if (err2) return callback(err2);
            callback(null, rows[0]);
        });
    });
};

export const getSystemErrors = (callback) => {
    db.query("SELECT * FROM system_errors ORDER BY created_at DESC", callback);
};

// Backups
export const createSystemBackup = (data, callback) => {
    const sql = `
        INSERT INTO system_backups (backup_name, status, file_size)
        VALUES (?, ?, ?)
    `;
    db.query(sql, [data.backupName, data.status, data.fileSize], (err, result) => {
        if (err) return callback(err);
        db.query("SELECT * FROM system_backups WHERE id = ?", [result.insertId], (err2, rows) => {
            if (err2) return callback(err2);
            callback(null, rows[0]);
        });
    });
};

export const getSystemBackups = (callback) => {
    db.query("SELECT * FROM system_backups ORDER BY created_at DESC", callback);
};

// Maintenance
export const createSystemMaintenance = (data, callback) => {
    const sql = `
        INSERT INTO system_maintenance (title, scheduled_time, duration_mins)
        VALUES (?, ?, ?)
    `;
    db.query(sql, [data.title, data.scheduledTime, data.durationMins], (err, result) => {
        if (err) return callback(err);
        db.query("SELECT * FROM system_maintenance WHERE id = ?", [result.insertId], (err2, rows) => {
            if (err2) return callback(err2);
            callback(null, rows[0]);
        });
    });
};

export const getSystemMaintenance = (callback) => {
    db.query("SELECT * FROM system_maintenance ORDER BY scheduled_time ASC", callback);
};

// Subscriptions & Licenses
export const createLicenseSubscription = (data, callback) => {
    const sql = `
        INSERT INTO licenses_subscriptions (entity_type, entity_id, license_or_sub_name, expiry_date, status)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [data.entityType, data.entityId, data.name, data.expiryDate, data.status || 'Active'], (err, result) => {
        if (err) return callback(err);
        db.query("SELECT * FROM licenses_subscriptions WHERE id = ?", [result.insertId], (err2, rows) => {
            if (err2) return callback(err2);
            callback(null, rows[0]);
        });
    });
};

export const getLicensesSubscriptions = (callback) => {
    db.query("SELECT * FROM licenses_subscriptions ORDER BY expiry_date ASC", callback);
};


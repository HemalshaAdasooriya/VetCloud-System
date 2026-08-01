import db from "../config/db.js";

// Initialize tables on startup
export const initializePaymentSettingsTable = () => {
    const createSettingsTable = `
        CREATE TABLE IF NOT EXISTS system_settings (
            setting_key VARCHAR(50) PRIMARY KEY,
            setting_value VARCHAR(255) NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    
    db.query(createSettingsTable, (err) => {
        if (err) {
            console.error("Error creating system_settings table:", err);
        } else {
            console.log("MySQL 'system_settings' table verified.");
            // Insert default if not present
            db.query("INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES ('commission_percentage', '10')", (err) => {
                if (err) console.error("Error seeding system_settings:", err);
            });
        }
    });

    // Alter appointments table to add payment_status if it doesn't exist
    db.query("SHOW COLUMNS FROM appointments LIKE 'payment_status'", (err, results) => {
        if (err) {
            console.error("Error checking appointments columns:", err);
            return;
        }
        if (results.length === 0) {
            db.query("ALTER TABLE appointments ADD COLUMN payment_status ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid'", (err) => {
                if (err) console.error("Error adding payment_status column to appointments:", err);
                else console.log("MySQL 'appointments' table altered: added payment_status.");
            });
        } else {
            console.log("MySQL 'appointments.payment_status' column verified.");
        }
    });
};

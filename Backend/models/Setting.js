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

    // Alter feedbacks table to add show_on_homepage if it doesn't exist
    db.query("SHOW COLUMNS FROM feedbacks LIKE 'show_on_homepage'", (err, results) => {
        if (err) {
            console.error("Error checking feedbacks columns:", err);
            return;
        }
        if (results.length === 0) {
            db.query("ALTER TABLE feedbacks ADD COLUMN show_on_homepage TINYINT(1) DEFAULT 0", (err) => {
                if (err) console.error("Error adding show_on_homepage column to feedbacks:", err);
                else console.log("MySQL 'feedbacks' table altered: added show_on_homepage.");
            });
        } else {
            console.log("MySQL 'feedbacks.show_on_homepage' column verified.");
        }
    });

    // Alter veterinarian_bank_details table to add minimum_payout if it doesn't exist
    db.query("SHOW COLUMNS FROM veterinarian_bank_details LIKE 'minimum_payout'", (err, results) => {
        if (err) {
            console.error("Error checking veterinarian_bank_details columns:", err);
            return;
        }
        if (results.length === 0) {
            db.query("ALTER TABLE veterinarian_bank_details ADD COLUMN minimum_payout INT DEFAULT 1000", (err) => {
                if (err) console.error("Error adding minimum_payout column to veterinarian_bank_details:", err);
                else console.log("MySQL 'veterinarian_bank_details' table altered: added minimum_payout.");
            });
        } else {
            console.log("MySQL 'veterinarian_bank_details.minimum_payout' column verified.");
        }
    });
};

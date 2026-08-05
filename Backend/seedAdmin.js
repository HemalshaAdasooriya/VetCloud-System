import dotenv from "dotenv";
dotenv.config();
import db from "./config/db.js";
import bcrypt from "bcryptjs";

const adminEmail = process.env.ADMIN_EMAIL || "vetcloudnew@gmail.com";
const adminPassword = process.env.ADMIN_PASSWORD || "icayrhqgdsjacytn";
const adminName = "System Administrator";

export function seedAdminAuto(exitOnComplete = false) {
    const hashedPassword = bcrypt.hashSync(adminPassword, 11);

    db.query("SELECT * FROM admins WHERE email = ?", [adminEmail], (err, results) => {
        if (err) {
            console.error("Error querying admins table on startup:", err.message);
            if (exitOnComplete) process.exit(1);
            return;
        }

        if (results && results.length > 0) {
            // Update existing admin password to match new credential
            const updateSql = "UPDATE admins SET password = ?, is_Active = 1 WHERE email = ?";
            db.query(updateSql, [hashedPassword, adminEmail], (upErr) => {
                if (upErr) {
                    console.error("Failed to update admin password:", upErr.message);
                } else {
                    console.log(`[AutoSeed] Admin credentials updated successfully for: ${adminEmail}`);
                }
                if (exitOnComplete) process.exit(0);
            });
        } else {
            const insertSql = `
                INSERT INTO admins (email, password, fullName, contact_No, isEmailVerified, is_Active)
                VALUES (?, ?, ?, ?, 1, 1)
            `;
            db.query(insertSql, [adminEmail, hashedPassword, adminName, "0771234567"], (insertErr) => {
                if (insertErr) {
                    console.error("Failed to auto-seed admin:", insertErr.message);
                } else {
                    console.log(`[AutoSeed] Successfully created admin account: ${adminEmail}`);
                }
                if (exitOnComplete) process.exit(0);
            });
        }
    });
}

// If executed directly from command line
if (process.argv[1] && process.argv[1].includes("seedAdmin.js")) {
    seedAdminAuto(true);
}

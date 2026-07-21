import fs from "fs";
import path from "path";
import db from "../config/db.js";
import { sendEmail } from "../config/email.js";
import { 
    createAdminNotification, 
    createComplaint, 
    getComplaints, 
    resolveComplaint, 
    createSystemError, 
    getSystemErrors, 
    createSystemBackup, 
    getSystemBackups, 
    createSystemMaintenance, 
    getSystemMaintenance, 
    createLicenseSubscription, 
    getLicensesSubscriptions 
} from "../models/Notification.js";
import { createPetOwner, createVeterinarian } from "../models/User.js";

// Utility to run queries with promises
const queryPromise = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

// 1. Get all admin system logs/data for UI
export const getSystemData = async (req, res) => {
    try {
        const complaintsList = await queryPromise("SELECT * FROM complaints ORDER BY created_at DESC");
        const errorsList = await queryPromise("SELECT * FROM system_errors ORDER BY created_at DESC");
        const backupsList = await queryPromise("SELECT * FROM system_backups ORDER BY created_at DESC");
        const maintenanceList = await queryPromise("SELECT * FROM system_maintenance ORDER BY scheduled_time ASC");
        const licensesList = await queryPromise("SELECT * FROM licenses_subscriptions ORDER BY expiry_date ASC");

        res.status(200).json({
            complaints: complaintsList,
            errors: errorsList,
            backups: backupsList,
            maintenance: maintenanceList,
            licenses: licensesList
        });
    } catch (error) {
        console.error("Error in getSystemData:", error);
        res.status(500).json({ message: "Failed to fetch notification system logs" });
    }
};

// 2. Resolve a complaint
export const resolveComplaintAction = (req, res) => {
    const { id } = req.params;
    resolveComplaint(id, (err) => {
        if (err) {
            console.error("Error resolving complaint:", err);
            return res.status(500).json({ message: "Failed to resolve complaint" });
        }
        res.status(200).json({ message: "Complaint resolved successfully" });
    });
};

// 3. Schedule maintenance
export const scheduleMaintenanceAction = (req, res) => {
    const { title, scheduledTime, durationMins } = req.body;
    if (!title || !scheduledTime || !durationMins) {
        return res.status(400).json({ message: "Missing title, scheduledTime, or durationMins" });
    }

    createSystemMaintenance({ title, scheduledTime, durationMins }, (err, result) => {
        if (err) {
            console.error("Error creating maintenance:", err);
            return res.status(500).json({ message: "Failed to schedule maintenance" });
        }

        // Notify admins in-app
        const io = req.app.get("io");
        createAdminNotification(io, {
            type: "system_maintenance",
            title: "New System Maintenance Scheduled",
            message: `Maintenance '${title}' is scheduled for ${new Date(scheduledTime).toLocaleString()} for ${durationMins} minutes.`
        });

        res.status(201).json({ message: "Maintenance scheduled successfully", data: result });
    });
};

// 4. Simulate Action triggers for different alert types
export const simulateAction = async (req, res) => {
    const { type } = req.params;
    const io = req.app.get("io");

    try {
        if (type === "user_registration") {
            const rand = Math.floor(Math.random() * 10000);
            const userEmail = `farmer_${rand}@example.com`;
            
            // Trigger in-app notification directly
            createAdminNotification(io, {
                type: "new_user_registration",
                title: "New User Registered",
                message: `New Pet Owner/Farmer registered: John Doe (email: ${userEmail}).`
            });

            return res.status(200).json({ message: "Simulated new user registration notification sent." });
        } 
        
        else if (type === "vet_registration") {
            const rand = Math.floor(Math.random() * 10000);
            const vetEmail = `doctor_${rand}@example.com`;
            const licenseNo = `LIC-${rand}`;

            // Trigger in-app notification directly
            createAdminNotification(io, {
                type: "new_vet_registration",
                title: "New Vet Registration Request",
                message: `New veterinarian registered: Dr. Smith (License: ${licenseNo}). Pending administrator approval.`
            });

            // Log a license track
            createLicenseSubscription({
                entityType: "Veterinarian",
                entityId: rand,
                name: `Vet License (${licenseNo})`,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // expiring in 30 days
            }, () => {});

            return res.status(200).json({ message: "Simulated veterinarian registration request notification sent." });
        } 
        
        else if (type === "appointment_conflict") {
            // Find/simulate overlapping slots
            createAdminNotification(io, {
                type: "appointment_conflict",
                title: "Appointment Conflict Detected",
                message: "Scheduling overlap: Dr. Vet has 2 approved appointments booked at 10:00 AM on the same slot."
            });

            return res.status(200).json({ message: "Simulated appointment conflict notification sent." });
        } 
        
        else if (type === "system_error") {
            const codes = ["ERR_DB_TIMEOUT", "ERR_MAIL_FAIL", "ERR_AUTH_FORBIDDEN", "ERR_SOCKET_DISCONNECT"];
            const code = codes[Math.floor(Math.random() * codes.length)];
            const errorMsg = `Simulated system anomaly detected: ${code} inside api route.`;

            // Insert into system_errors
            createSystemError({
                errorCode: code,
                message: errorMsg,
                severity: "Critical"
            }, (err, result) => {
                if (!err && result) {
                    createAdminNotification(io, {
                        type: "system_error",
                        title: "System Error Alert",
                        message: `Critical Error [${code}]: ${errorMsg}`
                    });
                }
            });

            return res.status(200).json({ message: "Simulated system error logged and notification sent." });
        } 
        
        else if (type === "complaint") {
            const rand = Math.floor(Math.random() * 1000);
            const title = `Billing discrepancy issue #${rand}`;
            const desc = "I was double charged LKR 1500.00 during my consultation with Dr. Perera yesterday. Please refund.";

            // Save complaint
            createComplaint({
                userId: 1,
                userRole: "farmer",
                title,
                description: desc
            }, (err, result) => {
                if (!err && result) {
                    createAdminNotification(io, {
                        type: "customer_complaint",
                        title: "New Customer Complaint",
                        message: `Complaint: '${title}' submitted by Pet Owner.`
                    });
                }
            });

            return res.status(200).json({ message: "Simulated complaint submitted and notification sent." });
        } 
        
        else if (type === "feedback") {
            createAdminNotification(io, {
                type: "feedback_received",
                title: "New Feedback Received",
                message: "A new review was submitted: Pet Owner left a 5-star rating for Dr. Harrison."
            });

            return res.status(200).json({ message: "Simulated feedback alert notification sent." });
        } 
        
        else if (type === "backup") {
            // Create a mock backup file physically in Backend/uploads/backups
            const backupDir = path.join("uploads", "backups");
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const timestamp = Date.now();
            const fileName = `vetcloud_backup_${timestamp}.sql`;
            const filePath = path.join(backupDir, fileName);

            // Write mock SQL content
            const content = `-- VetCloud MySQL Database Backup Dump\n-- Generated on ${new Date().toLocaleString()}\nUSE vetcloud;\n`;
            fs.writeFileSync(filePath, content, "utf8");

            const stats = fs.statSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(2) + " KB";

            // Save to DB
            createSystemBackup({
                backupName: fileName,
                status: "Success",
                fileSize: sizeKB
            }, async (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Failed to record backup status in database" });
                }

                // Send Email Notification to admins
                const adminList = await queryPromise("SELECT email FROM admins");
                const adminEmails = adminList.length > 0 ? adminList.map(a => a.email) : ["admin@vetcloud.com"];

                adminEmails.forEach(email => {
                    sendEmail({
                        to: email,
                        subject: "Database Backup Completed - Success",
                        html: `
                            <h2>Backup Completed Successfully</h2>
                            <p>A new system backup was created successfully.</p>
                            <ul>
                                <li><strong>Backup File:</strong> ${fileName}</li>
                                <li><strong>File Size:</strong> ${sizeKB}</li>
                                <li><strong>Created At:</strong> ${new Date().toLocaleString()}</li>
                            </ul>
                        `,
                        text: `Database backup ${fileName} of size ${sizeKB} created successfully.`
                    }).catch(console.error);
                });

                // Send In-App notification
                createAdminNotification(io, {
                    type: "backup_status",
                    title: "Backup Completion Status",
                    message: `Backup ${fileName} (${sizeKB}) completed successfully.`
                });

                res.status(200).json({ message: "Manual database backup executed and success email sent.", data: result });
            });
        } 
        
        else if (type === "daily_summary") {
            // Aggregate summary data
            const [ownersCount] = await queryPromise("SELECT COUNT(*) AS count FROM pet_owners");
            const [vetsCount] = await queryPromise("SELECT COUNT(*) AS count FROM veterinarians");
            const [appointmentsCount] = await queryPromise("SELECT COUNT(*) AS count FROM appointments");
            const [revenueSum] = await queryPromise("SELECT SUM(fee) AS sum FROM consultations");
            const [pendingComplaints] = await queryPromise("SELECT COUNT(*) AS count FROM complaints WHERE status = 'Pending'");
            const [recentErrors] = await queryPromise("SELECT COUNT(*) AS count FROM system_errors WHERE resolved = 0");

            const adminList = await queryPromise("SELECT email FROM admins");
            const adminEmails = adminList.length > 0 ? adminList.map(a => a.email) : ["admin@vetcloud.com"];

            adminEmails.forEach(email => {
                sendEmail({
                    to: email,
                    subject: "Daily System Summary Report - VetCloud",
                    html: `
                        <h2>Daily System Summary Report</h2>
                        <p>Here is the overview of the system status as of ${new Date().toLocaleDateString()}:</p>
                        <table style="width:100%; border-collapse:collapse; margin-top:15px;">
                            <tr style="background:#f8fafc;"><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">Total Registrations (Owners)</td><td style="padding:8px; border:1px solid #e2e8f0;">${ownersCount.count}</td></tr>
                            <tr><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">Total Registrations (Vets)</td><td style="padding:8px; border:1px solid #e2e8f0;">${vetsCount.count}</td></tr>
                            <tr style="background:#f8fafc;"><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">Total Appointments</td><td style="padding:8px; border:1px solid #e2e8f0;">${appointmentsCount.count}</td></tr>
                            <tr><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">Total Generated Revenue</td><td style="padding:8px; border:1px solid #e2e8f0;">LKR ${parseFloat(revenueSum.sum || 0).toFixed(2)}</td></tr>
                            <tr style="background:#f8fafc;"><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">Pending Customer Complaints</td><td style="padding:8px; border:1px solid #e2e8f0; color:#e11d48; font-weight:700;">${pendingComplaints.count}</td></tr>
                            <tr><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">Active System Anomalies</td><td style="padding:8px; border:1px solid #e2e8f0; color:#e11d48;">${recentErrors.count}</td></tr>
                        </table>
                        <p style="margin-top:20px; font-size:12px; color:#64748b;">Daily automated scan completed successfully.</p>
                    `,
                    text: `Daily Summary: Owners: ${ownersCount.count}, Vets: ${vetsCount.count}, Appointments: ${appointmentsCount.count}, Revenue: LKR ${revenueSum.sum || 0}.`
                }).catch(console.error);
            });

            return res.status(200).json({ message: "Daily system summary email dispatch simulated." });
        } 
        
        else if (type === "monthly_analytics") {
            // Aggregate analytics
            const [ownersCount] = await queryPromise("SELECT COUNT(*) AS count FROM pet_owners");
            const [vetsCount] = await queryPromise("SELECT COUNT(*) AS count FROM veterinarians");
            const [appointmentsCount] = await queryPromise("SELECT COUNT(*) AS count FROM appointments");
            const [revenueSum] = await queryPromise("SELECT SUM(fee) AS sum FROM consultations");

            const adminList = await queryPromise("SELECT email FROM admins");
            const adminEmails = adminList.length > 0 ? adminList.map(a => a.email) : ["admin@vetcloud.com"];

            adminEmails.forEach(email => {
                sendEmail({
                    to: email,
                    subject: "Monthly System Analytics Report - VetCloud",
                    html: `
                        <h2>Monthly System Analytics & Trends</h2>
                        <p>Consolidated statistics and health indicators for the past month:</p>
                        <div style="background-color:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:15px; margin:15px 0;">
                            <h3 style="color:#065f46; margin:0 0 10px 0;">Performance Indicators</h3>
                            <p style="margin:5px 0;"><strong>Active Platform Engagement:</strong> Excellent</p>
                            <p style="margin:5px 0;"><strong>Vet Availability Slot Fill Rate:</strong> 72%</p>
                        </div>
                        <table style="width:100%; border-collapse:collapse;">
                            <tr style="background:#f8fafc;"><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">Registered Pet Owners</td><td style="padding:8px; border:1px solid #e2e8f0;">${ownersCount.count}</td></tr>
                            <tr><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">Approved Veterinarians</td><td style="padding:8px; border:1px solid #e2e8f0;">${vetsCount.count}</td></tr>
                            <tr style="background:#f8fafc;"><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">Consultations Completed</td><td style="padding:8px; border:1px solid #e2e8f0;">${appointmentsCount.count}</td></tr>
                            <tr><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">Platform Revenue Growth</td><td style="padding:8px; border:1px solid #e2e8f0; color:#10b981; font-weight:700;">+14.5% (LKR ${parseFloat(revenueSum.sum || 0).toFixed(2)})</td></tr>
                        </table>
                    `,
                    text: `Monthly Analytics: Owners: ${ownersCount.count}, Vets: ${vetsCount.count}, Appointments: ${appointmentsCount.count}, Revenue: LKR ${revenueSum.sum || 0}.`
                }).catch(console.error);
            });

            return res.status(200).json({ message: "Monthly analytics email dispatch simulated." });
        } 
        
        else {
            return res.status(400).json({ message: `Unknown simulation alert type: ${type}` });
        }
    } catch (err) {
        console.error("Simulation error:", err);
        res.status(500).json({ message: "Error running notification simulation action" });
    }
};

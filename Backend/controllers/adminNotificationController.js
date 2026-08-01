import fs from "fs";
import path from "path";
import db from "../config/db.js";
import { sendEmail, getAppointmentConfirmationTemplate, getVaccinationReminderTemplate, getMedicalReportTemplate, getInvoiceTemplate, getDailyAppointmentScheduleTemplate, getMonthlyPerformanceReportTemplate, getSystemAnnouncementTemplate, getSecurityAlertTemplate, getFailedPaymentReportTemplate, getUserAccountIssueTemplate, getNewConsultationAssignmentTemplate } from "../config/email.js";
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
    getLicensesSubscriptions,
    createNotification
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
        let ownerId = 1;
        let ownerEmail = "farmer@example.com";
        let ownerName = "John Doe";
        const owners = await queryPromise("SELECT id, email, fullName FROM pet_owners LIMIT 1");
        if (owners.length > 0) {
            ownerId = owners[0].id;
            ownerEmail = owners[0].email;
            ownerName = owners[0].fullName;
        }

        let vetId = 1;
        let vetEmail = "doctor@example.com";
        let vetName = "Smith";
        const vets = await queryPromise("SELECT id, email, fullName FROM veterinarians LIMIT 1");
        if (vets.length > 0) {
            vetId = vets[0].id;
            vetEmail = vets[0].email;
            vetName = vets[0].fullName;
        }

        if (type === "user_registration") {
            const rand = Math.floor(Math.random() * 10000);
            const userEmail = `farmer_${rand}@example.com`;
            
            createAdminNotification(io, {
                type: "new_user_registration",
                title: "New User Registered",
                message: `New Pet Owner/Farmer registered: John Doe (email: ${userEmail}).`
            });

            return res.status(200).json({ message: "Simulated new user registration notification sent." });
        } 
        
        else if (type === "vet_registration") {
            const rand = Math.floor(Math.random() * 10000);
            const licenseNo = `LIC-${rand}`;

            createAdminNotification(io, {
                type: "new_vet_registration",
                title: "New Vet Registration Request",
                message: `New veterinarian registered: Dr. Smith (License: ${licenseNo}). Pending administrator approval.`
            });

            createLicenseSubscription({
                entityType: "Veterinarian",
                entityId: rand,
                name: `Vet License (${licenseNo})`,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }, () => {});

            return res.status(200).json({ message: "Simulated veterinarian registration request notification sent." });
        } 
        
        else if (type === "appointment_conflict") {
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

            createComplaint({
                userId: ownerId,
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
            const backupDir = path.join("uploads", "backups");
            if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

            const timestamp = Date.now();
            const fileName = `vetcloud_backup_${timestamp}.sql`;
            const filePath = path.join(backupDir, fileName);

            fs.writeFileSync(filePath, `-- VetCloud MySQL Backup\n`, "utf8");
            const stats = fs.statSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(2) + " KB";

            createSystemBackup({
                backupName: fileName,
                status: "Success",
                fileSize: sizeKB
            }, async (err, result) => {
                if (err) return res.status(500).json({ message: "Failed to record backup" });

                const adminList = await queryPromise("SELECT email FROM admins");
                const adminEmails = adminList.length > 0 ? adminList.map(a => a.email) : ["admin@vetcloud.com"];

                adminEmails.forEach(email => {
                    sendEmail({
                        to: email,
                        subject: "Database Backup Completed - Success",
                        html: `<h2>Backup Completed Successfully</h2><p>File: ${fileName} (${sizeKB})</p>`,
                        text: `Database backup ${fileName} successfully generated.`
                    }).catch(console.error);
                });

                createAdminNotification(io, {
                    type: "backup_status",
                    title: "Backup Completion Status",
                    message: `Backup ${fileName} (${sizeKB}) completed successfully.`
                });

                res.status(200).json({ message: "Manual database backup executed and success email sent.", data: result });
            });
        } 
        
        else if (type === "daily_summary") {
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
                    html: `<h2>Daily System Summary Report</h2><p>Revenue: LKR ${parseFloat(revenueSum.sum || 0).toFixed(2)}, Active Anomalies: ${recentErrors.count}</p>`,
                    text: `Daily Summary Report generated.`
                }).catch(console.error);
            });

            return res.status(200).json({ message: "Daily system summary email dispatch simulated." });
        } 
        
        else if (type === "monthly_analytics") {
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
                    html: `<h2>Monthly Analytics</h2><p>Total Revenue: LKR ${parseFloat(revenueSum.sum || 0).toFixed(2)}</p>`,
                    text: `Monthly Analytics Report generated.`
                }).catch(console.error);
            });

            return res.status(200).json({ message: "Monthly analytics email dispatch simulated." });
        }

        // ── PET OWNER SIMULATIONS ─────────────────────────────────────────────
        else if (type === "appointment_confirmed") {
            const dataNotify = {
                userId: ownerId,
                userRole: "Farmer/PetOwner",
                type: "appointment_confirmed",
                title: "Appointment Booking Confirmed",
                message: `Your appointment request for Bobby with Dr. ${vetName} has been successfully approved.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Farmer/PetOwner_${ownerId}`).emit("new-notification", dbNotify);
            });

            const emailHtml = getAppointmentConfirmationTemplate(ownerName, "Bobby", vetName, new Date(), "10:00 AM", "video", "General checkup");
            sendEmail({
                to: ownerEmail,
                subject: "Appointment Confirmation Details - VetCloud",
                html: emailHtml,
                text: `Dear ${ownerName}, your appointment is confirmed.`
            }).catch(console.error);

            return res.status(200).json({ message: "Simulated appointment confirmation alerts sent." });
        }

        else if (type === "appointment_rescheduled") {
            const dataNotify = {
                userId: ownerId,
                userRole: "Farmer/PetOwner",
                type: "appointment_rescheduled",
                title: "Appointment Rescheduled",
                message: `Your appointment request has been rescheduled. New slots proposed.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Farmer/PetOwner_${ownerId}`).emit("new-notification", dbNotify);
            });

            return res.status(200).json({ message: "Simulated rescheduled appointment alerts sent." });
        }

        else if (type === "appointment_cancelled") {
            const dataNotify = {
                userId: ownerId,
                userRole: "Farmer/PetOwner",
                type: "appointment_cancelled",
                title: "Appointment Cancelled",
                message: `Your consultation with Dr. ${vetName} was cancelled.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Farmer/PetOwner_${ownerId}`).emit("new-notification", dbNotify);
            });

            return res.status(200).json({ message: "Simulated cancellation alerts sent." });
        }

        else if (type === "vet_assigned") {
            const dataNotify = {
                userId: ownerId,
                userRole: "Farmer/PetOwner",
                type: "vet_assigned",
                title: "Veterinarian Assigned",
                message: `Veterinarian Dr. ${vetName} has been assigned to your consultation.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Farmer/PetOwner_${ownerId}`).emit("new-notification", dbNotify);
            });

            return res.status(200).json({ message: "Simulated veterinarian assignment notification sent." });
        }

        else if (type === "medical_record_updated") {
            const dataNotify = {
                userId: ownerId,
                userRole: "Farmer/PetOwner",
                type: "medical_updated",
                title: "Medical Record Updated",
                message: `Medical file for your animal Bobby has been updated by Dr. ${vetName}.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Farmer/PetOwner_${ownerId}`).emit("new-notification", dbNotify);
            });

            const emailHtml = getMedicalReportTemplate(ownerName, "Bobby", "Routine Treatment Notes", "Medical Notes", "Patient shows great progress.", vetName, new Date().toLocaleDateString());
            sendEmail({
                to: ownerEmail,
                subject: "Medical Report / Records Updated - VetCloud",
                html: emailHtml,
                text: `Bobby's medical history updated.`
            }).catch(console.error);

            return res.status(200).json({ message: "Simulated medical record update alerts sent." });
        }

        else if (type === "prescription_available") {
            const dataNotify = {
                userId: ownerId,
                userRole: "Farmer/PetOwner",
                type: "prescription_available",
                title: "Prescription Available",
                message: `New digital prescription file uploaded for Bobby by Dr. ${vetName}.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Farmer/PetOwner_${ownerId}`).emit("new-notification", dbNotify);
            });

            const emailHtml = getMedicalReportTemplate(ownerName, "Bobby", "Prescription Refill #1029", "Prescription", "Amoxicillin 250mg twice daily.", vetName, new Date().toLocaleDateString());
            sendEmail({
                to: ownerEmail,
                subject: "Prescription Refill File Available - VetCloud",
                html: emailHtml,
                text: `Prescription refill file available.`
            }).catch(console.error);

            return res.status(200).json({ message: "Simulated prescription available alerts sent." });
        }

        else if (type === "vaccination_due") {
            const dataNotify = {
                userId: ownerId,
                userRole: "Farmer/PetOwner",
                type: "vaccination_due",
                title: "Vaccination Due Soon",
                message: `Reminder: Vaccination 'Rabies Booster' is due for Bobby in 7 days.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Farmer/PetOwner_${ownerId}`).emit("new-notification", dbNotify);
            });

            const emailHtml = getVaccinationReminderTemplate(ownerName, "Bobby", "Rabies Booster", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
            sendEmail({
                to: ownerEmail,
                subject: "Vaccination Schedule Alert - VetCloud",
                html: emailHtml,
                text: `Bobby has a vaccination due soon.`
            }).catch(console.error);

            return res.status(200).json({ message: "Simulated vaccination due reminders sent." });
        }

        else if (type === "test_results") {
            const dataNotify = {
                userId: ownerId,
                userRole: "Farmer/PetOwner",
                type: "test_results",
                title: "Test Results Available",
                message: `Diagnostic lab test results are ready for Bobby.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Farmer/PetOwner_${ownerId}`).emit("new-notification", dbNotify);
            });

            const emailHtml = getMedicalReportTemplate(ownerName, "Bobby", "Blood Chemistry Profile", "Diagnostic", "All parameters normal.", vetName, new Date().toLocaleDateString());
            sendEmail({
                to: ownerEmail,
                subject: "Test Results Available - VetCloud",
                html: emailHtml,
                text: `Diagnostic test results ready.`
            }).catch(console.error);

            return res.status(200).json({ message: "Simulated test result notifications sent." });
        }

        else if (type === "payment_success") {
            const dataNotify = {
                userId: ownerId,
                userRole: "Farmer/PetOwner",
                type: "payment_success",
                title: "Payment Successful",
                message: `LKR 1,500.00 payment was successful. Receipt generated.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Farmer/PetOwner_${ownerId}`).emit("new-notification", dbNotify);
            });

            const emailHtml = getInvoiceTemplate(ownerName, "1500.00", "PAY-TEST-9921", new Date().toLocaleString(), "Bobby", vetName);
            sendEmail({
                to: ownerEmail,
                subject: "Payment Receipt / Invoice - VetCloud",
                html: emailHtml,
                text: `Invoice payment receipt for consultation.`
            }).catch(console.error);

            return res.status(200).json({ message: "Simulated successful payment receipt sent." });
        }

        else if (type === "feedback_request") {
            const dataNotify = {
                userId: ownerId,
                userRole: "Farmer/PetOwner",
                type: "feedback_request",
                title: "Feedback Request",
                message: `Please tell us about your experience consulting Dr. ${vetName} for Bobby.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Farmer/PetOwner_${ownerId}`).emit("new-notification", dbNotify);
            });

            return res.status(200).json({ message: "Simulated feedback request sent." });
        }

        // ── VETERINARIAN SIMULATIONS ──────────────────────────────────────────
        else if (type === "new_consultation_request") {
            const dataNotify = {
                userId: vetId,
                userRole: "Veterinary Doctor",
                type: "appointment_assigned",
                title: "New Consultation Request",
                message: `New request from client ${ownerName} for consultation of Bobby.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Veterinary Doctor_${vetId}`).emit("new-notification", dbNotify);
            });

            const emailHtml = getNewConsultationAssignmentTemplate(vetName, ownerName, "Bobby", new Date(), "10:00 AM");
            sendEmail({
                to: vetEmail,
                subject: "New Consultation Assignment - VetCloud",
                html: emailHtml,
                text: `Dear Dr. ${vetName}, you have a new consultation request.`
            }).catch(console.error);

            return res.status(200).json({ message: "Simulated consultation request alerts sent." });
        }

        else if (type === "emergency_case") {
            const dataNotify = {
                userId: vetId,
                userRole: "Veterinary Doctor",
                type: "appointment_conflict", // matches red alert style
                title: "🚨 EMERGENCY Case Submitted",
                message: `CRITICAL: Client ${ownerName} submitted an emergency request for bovine clinical support.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Veterinary Doctor_${vetId}`).emit("new-notification", dbNotify);
            });

            return res.status(200).json({ message: "Simulated emergency notification sent." });
        }

        else if (type === "medical_record_update_request") {
            const dataNotify = {
                userId: vetId,
                userRole: "Veterinary Doctor",
                type: "appointment_reminder",
                title: "Medical Record Update Request",
                message: `Please finalize and upload visit summaries for today's completed cases.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Veterinary Doctor_${vetId}`).emit("new-notification", dbNotify);
            });

            return res.status(200).json({ message: "Simulated medical record update request sent." });
        }

        else if (type === "daily_schedule") {
            const appts = [
                { slot_time: "09:30 AM", owner_name: "John Doe", animal_name: "Bobby", animal_species: "Dog", consultation_type: "video" },
                { slot_time: "11:00 AM", owner_name: "Alice Perera", animal_name: "Molly", animal_species: "Cow", consultation_type: "chat" }
            ];
            const emailHtml = getDailyAppointmentScheduleTemplate(vetName, appts);
            sendEmail({
                to: vetEmail,
                subject: "Daily Appointment Schedule - VetCloud",
                html: emailHtml,
                text: `Daily appointment schedule report.`
            }).catch(console.error);

            return res.status(200).json({ message: "Simulated daily schedule email dispatched." });
        }

        else if (type === "monthly_performance_report") {
            const stats = { completedCount: 24, revenue: 36000.00, averageRating: 4.8 };
            const emailHtml = getMonthlyPerformanceReportTemplate(vetName, stats);
            sendEmail({
                to: vetEmail,
                subject: "Monthly Performance Report - VetCloud",
                html: emailHtml,
                text: `Monthly performance stats summary.`
            }).catch(console.error);

            return res.status(200).json({ message: "Simulated monthly performance report email dispatched." });
        }

        else if (type === "system_announcement") {
            const emailHtml = getSystemAnnouncementTemplate("Service Interruption Notice", "The platform will undergo regular upgrades this Sunday between 02:00 AM and 04:00 AM LKR. Socket streams might disconnect briefly.");
            sendEmail({
                to: vetEmail,
                subject: "System Announcement - VetCloud Upgrade Notice",
                html: emailHtml,
                text: `System announcement concerning upcoming platform maintenance.`
            }).catch(console.error);

            return res.status(200).json({ message: "Simulated system announcement broadcast email sent." });
        }

        else if (type === "upcoming_appointments") {
            const dataNotify = {
                userId: vetId,
                userRole: "Veterinary Doctor",
                type: "appointment_reminder",
                title: "Upcoming Appointment Reminder",
                message: `Your scheduled consultation with ${ownerName} starts in 1 hour.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Veterinary Doctor_${vetId}`).emit("new-notification", dbNotify);
            });

            return res.status(200).json({ message: "Simulated upcoming appointment reminders sent." });
        }

        else if (type === "followup_review") {
            const dataNotify = {
                userId: vetId,
                userRole: "Veterinary Doctor",
                type: "followup_case_review",
                title: "Follow-up Case Review Required",
                message: `Please complete a follow-up review for Bobby (client: ${ownerName})'s diagnostic logs.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Veterinary Doctor_${vetId}`).emit("new-notification", dbNotify);
            });

            return res.status(200).json({ message: "Simulated follow-up alerts sent." });
        }

        else if (type === "pending_prescriptions") {
            const dataNotify = {
                userId: vetId,
                userRole: "Veterinary Doctor",
                type: "pending_prescription",
                title: "Pending Prescription Upload",
                message: `Reminder: prescription details remain pending for completed consultation #${ownerId}.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Veterinary Doctor_${vetId}`).emit("new-notification", dbNotify);
            });

            return res.status(200).json({ message: "Simulated pending prescription alerts sent." });
        }

        else if (type === "pending_medical_updates") {
            const dataNotify = {
                userId: vetId,
                userRole: "Veterinary Doctor",
                type: "pending_medical_update",
                title: "Pending Medical Record Update",
                message: `Reminder: animal clinical notes have not been finalized for completed consultation #${ownerId}.`
            };
            createNotification(dataNotify, (err, dbNotify) => {
                if (!err && dbNotify && io) io.to(`Veterinary Doctor_${vetId}`).emit("new-notification", dbNotify);
            });

            return res.status(200).json({ message: "Simulated pending medical record alerts sent." });
        }

        // ── ADMINISTRATOR SIMULATIONS ─────────────────────────────────────────
        else if (type === "failed_payment") {
            createAdminNotification(io, {
                type: "appointment_conflict", // matches red alert style
                title: "Failed Payment Transaction",
                message: `Failed transaction of LKR 1,500.00 for client ${ownerName} on appointment #12.`
            });

            const emailHtml = getFailedPaymentReportTemplate(12, ownerName, 1500.00, "Insufficient funds / card declined");
            const adminList = await queryPromise("SELECT email FROM admins");
            const adminEmails = adminList.length > 0 ? adminList.map(a => a.email) : ["admin@vetcloud.com"];

            adminEmails.forEach(email => {
                sendEmail({
                    to: email,
                    subject: "Failed Payment Report - VetCloud",
                    html: emailHtml,
                    text: `Billing transaction failed.`
                }).catch(console.error);
            });

            return res.status(200).json({ message: "Simulated failed payment report sent." });
        }

        else if (type === "security_alert") {
            const emailHtml = getSecurityAlertTemplate("Brute Force Detected", "Multiple consecutive failed login attempts detected on administrator account from IP: 198.162.1.20.", "Device: Chrome/Windows, Location: Unknown. Account remains active, please verify logs.");
            const adminList = await queryPromise("SELECT email FROM admins");
            const adminEmails = adminList.length > 0 ? adminList.map(a => a.email) : ["admin@vetcloud.com"];

            adminEmails.forEach(email => {
                sendEmail({
                    to: email,
                    subject: "Security Warning Alert - VetCloud Admin",
                    html: emailHtml,
                    text: `System security incident alert.`
                }).catch(console.error);
            });

            return res.status(200).json({ message: "Simulated security alert email dispatched." });
        }

        else if (type === "user_account_issue") {
            const emailHtml = getUserAccountIssueTemplate("Profile Spam Warning", "User Account John Doe (farmer_992@example.com) has been flagged by automated logs for sending spam consultations.");
            const adminList = await queryPromise("SELECT email FROM admins");
            const adminEmails = adminList.length > 0 ? adminList.map(a => a.email) : ["admin@vetcloud.com"];

            adminEmails.forEach(email => {
                sendEmail({
                    to: email,
                    subject: "Account Issue Alert - VetCloud Support",
                    html: emailHtml,
                    text: `User profile issue warning.`
                }).catch(console.error);
            });

            return res.status(200).json({ message: "Simulated account issue email sent." });
        }

        else if (type === "license_expiring") {
            createAdminNotification(io, {
                type: "system_maintenance",
                title: "Expiring License Alert",
                message: `License reminder: doctor Dr. Smith's veterinary practice permit is expiring within 30 days.`
            });

            return res.status(200).json({ message: "Simulated licensing expiry alert sent." });
        }

        else {
            return res.status(400).json({ message: `Unknown simulation alert type: ${type}` });
        }
    } catch (err) {
        console.error("Simulation error:", err);
        res.status(500).json({ message: "Error running notification simulation action" });
    }
};

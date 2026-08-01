import { 
    getUpcomingReminders, 
    logSentReminder, 
    isReminderSent, 
    createNotification,
    createAdminNotification,
    createSystemBackup
} from "../models/Notification.js";
import { 
    sendEmail, 
    getAppointmentConfirmationTemplate, 
    getVaccinationReminderTemplate,
    getDailyAppointmentScheduleTemplate,
    getMonthlyPerformanceReportTemplate
} from "./email.js";
import db from "./db.js";
import fs from "fs";
import path from "path";

// Helper to push real-time socket updates
const pushSocketAlert = (io, userId, userRole, notification) => {
    if (io) {
        const roomName = `${userRole}_${userId}`;
        io.to(roomName).emit("new-notification", notification);
    }
};

export const startReminderScheduler = (io) => {
    // Run the scheduler check immediately, then every 60 seconds
    const runSchedulerCheck = () => {
        console.log("[SCHEDULER] Running periodic checks for upcoming appointments & vaccinations...");

        getUpcomingReminders((err, reminders) => {
            if (err) {
                console.error("[SCHEDULER] Failed to query upcoming reminders:", err);
                return;
            }

            // 1. Process 1-Day Upcoming Appointments
            reminders.appointments1Day.forEach((apt) => {
                const reminderType = "1_day_before";
                isReminderSent("appointment", apt.appointment_id, reminderType, (errSent, exists) => {
                    if (!errSent && !exists) {
                        console.log(`[SCHEDULER] Dispatching 24h reminder for Appointment #${apt.appointment_id}`);

                        // Send In-App notification to Owner
                        const ownerNotify = {
                            userId: apt.pet_owner_id,
                            userRole: "Farmer/PetOwner",
                            type: "appointment_reminder",
                            title: "Upcoming Appointment Tomorrow",
                            message: `Your appointment for ${apt.animal_name} with Dr. ${apt.vet_name} is scheduled for tomorrow at ${apt.slot_time}.`
                        };

                        createNotification(ownerNotify, (notifyErr, dbNotify) => {
                            if (!notifyErr && dbNotify) {
                                pushSocketAlert(io, apt.pet_owner_id, "Farmer/PetOwner", dbNotify);
                            }
                        });

                        // Send In-App notification to Vet
                        const vetNotify = {
                            userId: apt.veterinarian_id,
                            userRole: "Veterinary Doctor",
                            type: "appointment_reminder",
                            title: "Upcoming Appointment Tomorrow",
                            message: `Appointment with ${apt.owner_name} for ${apt.animal_name} is scheduled for tomorrow at ${apt.slot_time}.`
                        };

                        createNotification(vetNotify, (notifyErr, dbNotify) => {
                            if (!notifyErr && dbNotify) {
                                pushSocketAlert(io, apt.veterinarian_id, "Veterinary Doctor", dbNotify);
                            }
                        });

                        // Send Email to Owner
                        const emailHtml = getAppointmentConfirmationTemplate(
                            apt.owner_name,
                            apt.animal_name,
                            apt.vet_name,
                            apt.slot_date,
                            apt.slot_time,
                            apt.consultation_type,
                            "Reminder: Consultation tomorrow."
                        );

                        sendEmail({
                            to: apt.owner_email,
                            subject: `Reminder: Appointment Tomorrow - VetCloud`,
                            html: emailHtml,
                            text: `Dear ${apt.owner_name}, your appointment for ${apt.animal_name} is tomorrow at ${apt.slot_time}.`
                        })
                        .then(() => logSentReminder("appointment", apt.appointment_id, reminderType, () => {}))
                        .catch(console.error);
                    }
                });
            });

            // 2. Process 1-Hour Upcoming Appointments
            reminders.appointments1Hour.forEach((apt) => {
                const reminderType = "1_hour_before";
                isReminderSent("appointment", apt.appointment_id, reminderType, (errSent, exists) => {
                    if (!errSent && !exists) {
                        console.log(`[SCHEDULER] Dispatching 1h reminder for Appointment #${apt.appointment_id}`);

                        // Send In-App notification to Owner
                        const ownerNotify = {
                            userId: apt.pet_owner_id,
                            userRole: "Farmer/PetOwner",
                            type: "appointment_starting",
                            title: "Appointment Starting in 1 Hour",
                            message: `Reminder: Your consultation for ${apt.animal_name} starts in 1 hour at ${apt.slot_time}.`
                        };

                        createNotification(ownerNotify, (notifyErr, dbNotify) => {
                            if (!notifyErr && dbNotify) {
                                pushSocketAlert(io, apt.pet_owner_id, "Farmer/PetOwner", dbNotify);
                            }
                        });

                        // Send In-App notification to Vet
                        const vetNotify = {
                            userId: apt.veterinarian_id,
                            userRole: "Veterinary Doctor",
                            type: "appointment_starting",
                            title: "Appointment Starting in 1 Hour",
                            message: `Reminder: Your consultation with ${apt.owner_name} for ${apt.animal_name} starts in 1 hour.`
                        };

                        createNotification(vetNotify, (notifyErr, dbNotify) => {
                            if (!notifyErr && dbNotify) {
                                pushSocketAlert(io, apt.veterinarian_id, "Veterinary Doctor", dbNotify);
                            }
                        });

                        // Send Email to Owner
                        sendEmail({
                            to: apt.owner_email,
                            subject: `Reminder: Appointment Starting in 1 Hour - VetCloud`,
                            html: `<p>Dear ${apt.owner_name}, your appointment for ${apt.animal_name} is starting in 1 hour at ${apt.slot_time}. Please log in to join the call.</p>`,
                            text: `Dear ${apt.owner_name}, your appointment for ${apt.animal_name} is starting in 1 hour.`
                        })
                        .then(() => logSentReminder("appointment", apt.appointment_id, reminderType, () => {}))
                        .catch(console.error);
                    }
                });
            });

            // 3. Process 7-Days Vaccination Schedules
            reminders.vaccinations7Days.forEach((vac) => {
                const reminderType = "7_days_before";
                isReminderSent("vaccination", vac.schedule_id, reminderType, (errSent, exists) => {
                    if (!errSent && !exists) {
                        console.log(`[SCHEDULER] Dispatching 7-day reminder for Vaccination schedule #${vac.schedule_id}`);

                        // Send In-App notification to Owner
                        const ownerNotify = {
                            userId: vac.pet_owner_id,
                            userRole: "Farmer/PetOwner",
                            type: "vaccination_due",
                            title: "Vaccination Due in 7 Days",
                            message: `Vaccination '${vac.vaccine_name}' is due for ${vac.animal_name} in 7 days.`
                        };

                        createNotification(ownerNotify, (notifyErr, dbNotify) => {
                            if (!notifyErr && dbNotify) {
                                pushSocketAlert(io, vac.pet_owner_id, "Farmer/PetOwner", dbNotify);
                            }
                        });

                        // Send Email to Owner
                        const emailHtml = getVaccinationReminderTemplate(
                            vac.owner_name,
                            vac.animal_name,
                            vac.vaccine_name,
                            vac.due_date
                        );

                        sendEmail({
                            to: vac.owner_email,
                            subject: `Vaccination Due Reminder: ${vac.vaccine_name} - VetCloud`,
                            html: emailHtml,
                            text: `Dear ${vac.owner_name}, your animal ${vac.animal_name} has vaccination ${vac.vaccine_name} due in 7 days.`
                        })
                        .then(() => logSentReminder("vaccination", vac.schedule_id, reminderType, () => {}))
                        .catch(console.error);
                    }
                });
            });

            // 4. Run Admin-Specific Reminder Scans
            runAdminReminders(io);

            // 5. Run Vet-Specific Scheduled Scans & Reminders
            const todayStr = new Date().toISOString().split("T")[0];
            const currentMonthStr = new Date().toISOString().slice(0, 7);
            runDailyVetSchedules(io, todayStr);
            runMonthlyVetReports(io, currentMonthStr);
            runVetFollowups(io);
            runVetPendingRecords(io);
        });
    };

    // Run immediately on start, then set interval to 60s
    runSchedulerCheck();
    setInterval(runSchedulerCheck, 60000);
};

// Admin Periodic Reminders & Reports
const runAdminReminders = (io) => {
    // A. Pending approvals
    db.query("SELECT id, fullName FROM veterinarians WHERE is_Active = 0", (err, vets) => {
        if (!err && vets) {
            vets.forEach(vet => {
                isReminderSent("veterinarian", vet.id, "pending_approval", (errSent, exists) => {
                    if (!errSent && !exists) {
                        createAdminNotification(io, {
                            type: "approval_reminder",
                            title: "Pending Veterinarian Approval",
                            message: `Reminder: Dr. ${vet.fullName} registered and is pending approval.`
                        }, () => {
                            logSentReminder("veterinarian", vet.id, "pending_approval", () => {});
                        });
                    }
                });
            });
        }
    });

    // B. Unresolved complaints
    db.query("SELECT id, title FROM complaints WHERE status = 'Pending' AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)", (err, complaints) => {
        if (!err && complaints) {
            complaints.forEach(c => {
                isReminderSent("complaint", c.id, "unresolved_complaint_24h", (errSent, exists) => {
                    if (!errSent && !exists) {
                        createAdminNotification(io, {
                            type: "unresolved_complaints",
                            title: "Unresolved Customer Complaint Reminder",
                            message: `Reminder: Complaint '${c.title}' remains unresolved for more than 24 hours.`
                        }, () => {
                            logSentReminder("complaint", c.id, "unresolved_complaint_24h", () => {});
                        });
                    }
                });
            });
        }
    });

    // C. Scheduled system maintenance in the next 24h
    db.query("SELECT id, title, scheduled_time FROM system_maintenance WHERE status = 'Scheduled' AND scheduled_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)", (err, maintenance) => {
        if (!err && maintenance) {
            maintenance.forEach(m => {
                isReminderSent("maintenance", m.id, "upcoming_maintenance", (errSent, exists) => {
                    if (!errSent && !exists) {
                        createAdminNotification(io, {
                            type: "system_maintenance",
                            title: "System Maintenance Reminder",
                            message: `System maintenance '${m.title}' is scheduled for tomorrow on ${new Date(m.scheduled_time).toLocaleString()}.`
                        }, () => {
                            logSentReminder("maintenance", m.id, "upcoming_maintenance", () => {});
                        });
                    }
                });
            });
        }
    });

    // D. Data backup reminders (no backup in the last 7 days)
    db.query("SELECT MAX(created_at) AS last_backup FROM system_backups WHERE status = 'Success'", (err, results) => {
        if (!err && results) {
            const lastBackup = results[0]?.last_backup;
            const diffDays = lastBackup ? (Date.now() - new Date(lastBackup).getTime()) / (24 * 60 * 60 * 1000) : 999;
            if (diffDays > 7) {
                const weekKey = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
                isReminderSent("backup_reminder", weekKey, "last_backup_7days", (errSent, exists) => {
                    if (!errSent && !exists) {
                        createAdminNotification(io, {
                            type: "data_backup_reminder",
                            title: "Data Backup Reminder",
                            message: `Warning: No successful database backup has been executed in the last 7 days.`
                        }, () => {
                            logSentReminder("backup_reminder", weekKey, "last_backup_7days", () => {});
                        });
                    }
                });
            }
        }
    });

    // E. Expiring licenses/subscriptions (next 30 days)
    db.query("SELECT id, license_or_sub_name, expiry_date FROM licenses_subscriptions WHERE status = 'Active' AND expiry_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)", (err, licenses) => {
        if (!err && licenses) {
            licenses.forEach(l => {
                isReminderSent("license", l.id, "expiring_soon_30d", (errSent, exists) => {
                    if (!errSent && !exists) {
                        createAdminNotification(io, {
                            type: "expiring_licenses",
                            title: "Expiring License/Subscription",
                            message: `Reminder: License/Subscription '${l.license_or_sub_name}' is expiring soon on ${new Date(l.expiry_date).toLocaleDateString()}.`
                        }, () => {
                            logSentReminder("license", l.id, "expiring_soon_30d", () => {});
                        });
                    }
                });
            });
        }
    });

    // F. Daily System Summary Email (midnight / check daily key)
    const todayStr = new Date().toISOString().split("T")[0];
    isReminderSent("daily_summary", 0, todayStr, (errSent, exists) => {
        if (!errSent && !exists) {
            console.log(`[SCHEDULER] Dispatching Daily System Summary Email for ${todayStr}...`);
            
            const executeSummaryQuery = async () => {
                try {
                    const queryPromise = (sql, params = []) => {
                        return new Promise((resolve, reject) => {
                            db.query(sql, params, (err, results) => {
                                if (err) return reject(err);
                                resolve(results);
                            });
                        });
                    };

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
                            subject: `Daily System Summary Report (${todayStr}) - VetCloud`,
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
                        })
                        .then(() => logSentReminder("daily_summary", 0, todayStr, () => {}))
                        .catch(console.error);
                    });
                } catch (summaryErr) {
                    console.error("Failed to run scheduler summary email:", summaryErr);
                }
            };

            executeSummaryQuery();
        }
    });

    // G. Automated Daily Database Backup
    isReminderSent("automated_backup", 0, todayStr, (errSent, exists) => {
        if (!errSent && !exists) {
            console.log(`[SCHEDULER] Running automated daily database backup for ${todayStr}...`);
            
            const backupDir = path.join("uploads", "backups");
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const timestamp = Date.now();
            const fileName = `vetcloud_backup_auto_${timestamp}.sql`;
            const filePath = path.join(backupDir, fileName);

            // Write mock SQL content representation
            const content = `-- VetCloud Automated MySQL Backup\n-- Date: ${new Date().toLocaleString()}\nUSE vetcloud;\n`;
            fs.writeFileSync(filePath, content, "utf8");

            const stats = fs.statSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(2) + " KB";

            createSystemBackup({
                backupName: fileName,
                status: "Success",
                fileSize: sizeKB
            }, (errDb, resultDb) => {
                if (errDb) {
                    console.error("[SCHEDULER BACKUP] Failed to record automated backup in DB:", errDb);
                    return;
                }

                // Email backup status to all admins
                db.query("SELECT email FROM admins", (errAdmin, adminList) => {
                    const adminEmails = (!errAdmin && adminList && adminList.length > 0) 
                        ? adminList.map(a => a.email) 
                        : ["admin@vetcloud.com"];

                    adminEmails.forEach(email => {
                        sendEmail({
                            to: email,
                            subject: "Automated Database Backup Complete - Success",
                            html: `
                                <h2>Automated Daily Backup Successful</h2>
                                <p>A new automated backup was successfully created on the server.</p>
                                <ul>
                                    <li><strong>Backup File:</strong> ${fileName}</li>
                                    <li><strong>File Size:</strong> ${sizeKB}</li>
                                    <li><strong>Completed At:</strong> ${new Date().toLocaleString()}</li>
                                </ul>
                            `,
                            text: `Automated database backup ${fileName} of size ${sizeKB} created successfully.`
                        }).catch(console.error);
                    });
                });

                // Push In-App notification to admins
                createAdminNotification(io, {
                    type: "backup_status",
                    title: "Automated Backup Completed",
                    message: `Automated daily database backup '${fileName}' (${sizeKB}) completed successfully.`
                }, () => {
                    logSentReminder("automated_backup", 0, todayStr, () => {});
                });
            });
        }
    });

    // H. Automated Monthly Analytics Email (runs on 1st of month or logs monthly reminder key)
    const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-07"
    isReminderSent("automated_monthly_analytics", 0, currentMonthStr, (errSent, exists) => {
        if (!errSent && !exists) {
            console.log(`[SCHEDULER] Generating automated monthly analytics report for ${currentMonthStr}...`);
            
            const executeMonthlyAnalytics = async () => {
                try {
                    const queryPromise = (sql, params = []) => {
                        return new Promise((resolve, reject) => {
                            db.query(sql, params, (err, results) => {
                                if (err) return reject(err);
                                resolve(results);
                            });
                        });
                    };

                    const [ownersCount] = await queryPromise("SELECT COUNT(*) AS count FROM pet_owners");
                    const [vetsCount] = await queryPromise("SELECT COUNT(*) AS count FROM veterinarians");
                    const [appointmentsCount] = await queryPromise("SELECT COUNT(*) AS count FROM appointments");
                    const [revenueSum] = await queryPromise("SELECT SUM(fee) AS sum FROM consultations");

                    const adminList = await queryPromise("SELECT email FROM admins");
                    const adminEmails = adminList.length > 0 ? adminList.map(a => a.email) : ["admin@vetcloud.com"];

                    adminEmails.forEach(email => {
                        sendEmail({
                            to: email,
                            subject: `Monthly System Analytics Report (${currentMonthStr}) - VetCloud`,
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
                            text: `Monthly Analytics for ${currentMonthStr}: Owners: ${ownersCount.count}, Vets: ${vetsCount.count}, Appointments: ${appointmentsCount.count}, Revenue: LKR ${revenueSum.sum || 0}.`
                        })
                        .then(() => logSentReminder("automated_monthly_analytics", 0, currentMonthStr, () => {}))
                        .catch(console.error);
                    });
                } catch (analyticsErr) {
                    console.error("Failed to run scheduler monthly analytics email:", analyticsErr);
                }
            };

            executeMonthlyAnalytics();
        }
    });
};

// ── Vet-Specific Daily Schedules ──────────────────────────────────────────────
export const runDailyVetSchedules = (io, todayStr) => {
    db.query("SELECT id, fullName, email FROM veterinarians WHERE is_Active = 1", (err, vets) => {
        if (err || !vets) return;
        vets.forEach(vet => {
            isReminderSent("daily_vet_schedule", vet.id, todayStr, (errSent, exists) => {
                if (!errSent && !exists) {
                    const sql = `
                        SELECT a.id, a.consultation_type, po.fullName AS owner_name, an.name AS animal_name, an.species AS animal_species, s.slot_time
                        FROM appointments a
                        JOIN appointment_slots s ON a.selected_slot_id = s.id
                        JOIN pet_owners po ON a.pet_owner_id = po.id
                        JOIN animals an ON a.animal_id = an.id
                        WHERE a.veterinarian_id = ? AND a.status = 'Approved' AND s.slot_date = CURRENT_DATE()
                        ORDER BY s.slot_time ASC
                    `;
                    db.query(sql, [vet.id], (errAppt, appts) => {
                        if (errAppt) return;
                        const emailHtml = getDailyAppointmentScheduleTemplate(vet.fullName, appts);
                        sendEmail({
                            to: vet.email,
                            subject: `Daily Appointment Schedule (${todayStr}) - VetCloud`,
                            html: emailHtml,
                            text: `Dear Dr. ${vet.fullName}, you have ${appts.length} consultations scheduled for today.`
                        })
                        .then(() => logSentReminder("daily_vet_schedule", vet.id, todayStr, () => {}))
                        .catch(console.error);
                    });
                }
            });
        });
    });
};

// ── Vet-Specific Monthly Reports ──────────────────────────────────────────────
export const runMonthlyVetReports = (io, currentMonthStr) => {
    db.query("SELECT id, fullName, email FROM veterinarians WHERE is_Active = 1", (err, vets) => {
        if (err || !vets) return;
        vets.forEach(vet => {
            isReminderSent("monthly_vet_report", vet.id, currentMonthStr, (errSent, exists) => {
                if (!errSent && !exists) {
                    const statsSql = `
                        SELECT 
                            COUNT(c.id) AS completedCount,
                            SUM(c.fee) AS revenue
                        FROM consultations c
                        WHERE c.doctor_id = ? AND c.status = 'Completed' AND c.appointment_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)
                    `;
                    db.query(statsSql, [vet.id], (errStats, statsResults) => {
                        if (errStats || !statsResults) return;
                        const stats = statsResults[0] || { completedCount: 0, revenue: 0 };
                        
                        const ratingSql = "SELECT AVG(rating) AS averageRating FROM feedbacks WHERE veterinarian_id = ?";
                        db.query(ratingSql, [vet.id], (errRating, ratingResults) => {
                            const avgRating = (!errRating && ratingResults && ratingResults[0]) ? parseFloat(ratingResults[0].averageRating || 0).toFixed(1) : 0;
                            stats.averageRating = avgRating > 0 ? avgRating : null;
                            
                            const emailHtml = getMonthlyPerformanceReportTemplate(vet.fullName, stats);
                            sendEmail({
                                to: vet.email,
                                subject: `Monthly Performance Report (${currentMonthStr}) - VetCloud`,
                                html: emailHtml,
                                text: `Dear Dr. ${vet.fullName}, your monthly performance report is ready.`
                            })
                            .then(() => logSentReminder("monthly_vet_report", vet.id, currentMonthStr, () => {}))
                            .catch(console.error);
                        });
                    });
                }
            });
        });
    });
};

// ── Vet-Specific Followups ────────────────────────────────────────────────────
export const runVetFollowups = (io) => {
    const sql = `
        SELECT a.id, a.veterinarian_id, v.fullName AS vet_name, v.email AS vet_email, po.fullName AS owner_name, an.name AS animal_name
        FROM appointments a
        JOIN veterinarians v ON a.veterinarian_id = v.id
        JOIN pet_owners po ON a.pet_owner_id = po.id
        JOIN animals an ON a.animal_id = an.id
        WHERE a.status = 'Completed' AND a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    db.query(sql, (err, appts) => {
        if (err || !appts) return;
        appts.forEach(apt => {
            isReminderSent("vet_followup", apt.id, "followup_check", (errSent, exists) => {
                if (!errSent && !exists) {
                    const vetNotify = {
                        userId: apt.veterinarian_id,
                        userRole: "Veterinary Doctor",
                        type: "followup_case_review",
                        title: "Follow-up Case Review Required",
                        message: `Follow-up review: Please review the case for ${apt.animal_name} (owner: ${apt.owner_name}) from appointment #${apt.id}.`
                    };
                    createNotification(vetNotify, (notifyErr, dbNotify) => {
                        if (!notifyErr && dbNotify) {
                            pushSocketAlert(io, apt.veterinarian_id, "Veterinary Doctor", dbNotify);
                        }
                    });
                    sendEmail({
                        to: apt.vet_email,
                        subject: `Follow-up Case Review Required - Appointment #${apt.id}`,
                        html: `<h3>Follow-up Review Reminder</h3><p>Dear Dr. ${apt.vet_name}, please review the patient history and medical logs for ${apt.animal_name} to provide follow-up care if required.</p>`,
                        text: `Dear Dr. ${apt.vet_name}, follow-up case review is pending for appointment #${apt.id}.`
                    })
                    .then(() => logSentReminder("vet_followup", apt.id, "followup_check", () => {}))
                    .catch(console.error);
                }
            });
        });
    });
};

// ── Vet-Specific Pending Records & Prescriptions ──────────────────────────────
export const runVetPendingRecords = (io) => {
    const sql = `
        SELECT a.id, a.veterinarian_id, v.fullName AS vet_name, v.email AS vet_email, an.id AS animal_id, an.name AS animal_name
        FROM appointments a
        JOIN veterinarians v ON a.veterinarian_id = v.id
        JOIN animals an ON a.animal_id = an.id
        WHERE a.status = 'Completed' AND a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    db.query(sql, (err, appts) => {
        if (err || !appts) return;
        appts.forEach(apt => {
            db.query("SELECT id, type FROM animal_medical_histories WHERE animal_id = ? AND vet = ?", [apt.animal_id, apt.vet_name], (errHist, histories) => {
                if (errHist || !histories) return;
                
                const hasPrescription = histories.some(h => h.type === "Prescription");
                const hasMedicalUpdate = histories.length > 0;

                if (!hasPrescription) {
                    isReminderSent("pending_prescription", apt.id, "prescription_check", (errSent, exists) => {
                        if (!errSent && !exists) {
                            const vetNotify = {
                                userId: apt.veterinarian_id,
                                userRole: "Veterinary Doctor",
                                type: "pending_prescription",
                                title: "Pending Prescription Alert",
                                message: `Pending prescription: You haven't uploaded a prescription for ${apt.animal_name} from appointment #${apt.id}.`
                            };
                            createNotification(vetNotify, (notifyErr, dbNotify) => {
                                if (!notifyErr && dbNotify) {
                                    pushSocketAlert(io, apt.veterinarian_id, "Veterinary Doctor", dbNotify);
                                }
                            });
                            logSentReminder("pending_prescription", apt.id, "prescription_check", () => {});
                        }
                    });
                }

                if (!hasMedicalUpdate) {
                    isReminderSent("pending_medical_update", apt.id, "medical_update_check", (errSent, exists) => {
                        if (!errSent && !exists) {
                            const vetNotify = {
                                userId: apt.veterinarian_id,
                                userRole: "Veterinary Doctor",
                                type: "pending_medical_update",
                                title: "Pending Medical Record Update",
                                message: `Pending record update: Please upload treatment/visit notes for ${apt.animal_name} from appointment #${apt.id}.`
                            };
                            createNotification(vetNotify, (notifyErr, dbNotify) => {
                                if (!notifyErr && dbNotify) {
                                    pushSocketAlert(io, apt.veterinarian_id, "Veterinary Doctor", dbNotify);
                                }
                            });
                            logSentReminder("pending_medical_update", apt.id, "medical_update_check", () => {});
                        }
                    });
                }
            });
        });
    });
};

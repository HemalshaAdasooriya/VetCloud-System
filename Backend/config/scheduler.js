import { 
    getUpcomingReminders, 
    logSentReminder, 
    isReminderSent, 
    createNotification 
} from "../models/Notification.js";
import { 
    sendEmail, 
    getAppointmentConfirmationTemplate, 
    getVaccinationReminderTemplate 
} from "./email.js";

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
        });
    };

    // Run immediately on start, then set interval to 60s
    runSchedulerCheck();
    setInterval(runSchedulerCheck, 60000);
};

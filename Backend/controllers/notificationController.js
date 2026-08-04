import jwt from "jsonwebtoken";
import { 
    createNotification, 
    getNotificationsByUser, 
    markAsRead, 
    markAllAsRead, 
    getVaccinationSchedulesByOwner,
    createVaccinationSchedule
} from "../models/Notification.js";
import { 
    getAppointmentById 
} from "../models/Appointment.js";
import { 
    getUserByIdAndRole 
} from "../models/User.js";
import { 
    sendEmail, 
    getInvoiceTemplate, 
    getAccountVerificationTemplate,
    getNewConsultationAssignmentTemplate
} from "../config/email.js";
import db from "../config/db.js";

// Helper to verify token from headers
const verifyToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw { status: 401, message: "Unauthorized: No token provided" };
    }
    try {
        const token = authHeader.split(" ")[1];
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        throw { status: 401, message: "Unauthorized: Invalid or expired token" };
    }
};

// Push real-time notification via Socket.io
const pushRealtimeNotification = (req, userId, userRole, notification) => {
    const io = req.app ? req.app.get("io") : null;
    if (io) {
        const rooms = [`${userRole}_${userId}`];
        const lower = (userRole || '').toLowerCase();
        if (lower.includes('farmer') || lower.includes('petowner') || lower.includes('owner')) {
            rooms.push(`Farmer/PetOwner_${userId}`, `farmer_${userId}`, `pet_owner_${userId}`);
        } else if (lower.includes('doctor') || lower.includes('vet')) {
            rooms.push(`Veterinary Doctor_${userId}`, `doctor_${userId}`, `vet_${userId}`);
        }
        
        // Emit to all matching rooms
        const uniqueRooms = [...new Set(rooms)];
        uniqueRooms.forEach(room => {
            io.to(room).emit("new-notification", notification);
        });
        console.log(`Socket: Pushed realtime notification to rooms: ${uniqueRooms.join(', ')}`);
    }
};

// 1. Fetch recent notifications
export const getNotifications = (req, res) => {
    let decoded;
    try { decoded = verifyToken(req); }
    catch (err) { return res.status(err.status || 401).json({ message: err.message }); }

    getNotificationsByUser(decoded.id, decoded.role, (err, results) => {
        if (err) {
            console.error("Error fetching notifications:", err);
            return res.status(500).json({ message: "Failed to fetch notifications" });
        }
        res.status(200).json(results);
    });
};

// 2. Mark notification as read
export const readNotification = (req, res) => {
    let decoded;
    try { decoded = verifyToken(req); }
    catch (err) { return res.status(err.status || 401).json({ message: err.message }); }

    const notificationId = req.params.id;

    markAsRead(notificationId, decoded.id, decoded.role, (err, result) => {
        if (err) {
            console.error("Error marking notification read:", err);
            return res.status(500).json({ message: "Failed to mark notification as read" });
        }
        res.status(200).json({ message: "Notification marked as read" });
    });
};

// 3. Mark all notifications as read
export const readAllNotifications = (req, res) => {
    let decoded;
    try { decoded = verifyToken(req); }
    catch (err) { return res.status(err.status || 401).json({ message: err.message }); }

    markAllAsRead(decoded.id, decoded.role, (err, result) => {
        if (err) {
            console.error("Error marking all read:", err);
            return res.status(500).json({ message: "Failed to mark all as read" });
        }
        res.status(200).json({ message: "All notifications marked as read" });
    });
};

// 4. Fetch vaccination schedules
export const getVaccinations = (req, res) => {
    let decoded;
    try { decoded = verifyToken(req); }
    catch (err) { return res.status(err.status || 401).json({ message: err.message }); }

    if (decoded.role !== 'Farmer/PetOwner' && decoded.role !== 'farmer') {
        return res.status(403).json({ message: "Only Farmers/Pet Owners can view vaccinations" });
    }

    getVaccinationSchedulesByOwner(decoded.id, (err, results) => {
        if (err) {
            console.error("Error fetching vaccinations:", err);
            return res.status(500).json({ message: "Failed to fetch vaccination schedules" });
        }
        res.status(200).json(results);
    });
};

// 5. Add a vaccination schedule item
export const addVaccination = (req, res) => {
    let decoded;
    try { decoded = verifyToken(req); }
    catch (err) { return res.status(err.status || 401).json({ message: err.message }); }

    const { animalId, vaccineName, dueDate } = req.body;

    if (!animalId || !vaccineName || !dueDate) {
        return res.status(400).json({ message: "animalId, vaccineName, and dueDate are required" });
    }

    createVaccinationSchedule({ animalId, vaccineName, dueDate, status: 'Pending' }, (err, result) => {
        if (err) {
            console.error("Error creating vaccination schedule:", err);
            return res.status(500).json({ message: "Failed to create vaccination schedule" });
        }

        // Generate in-app alert that vaccination schedule has been registered
        const notifyData = {
            userId: decoded.id,
            userRole: decoded.role,
            type: "vaccination_scheduled",
            title: "Vaccination Scheduled",
            message: `Vaccination schedule added: ${vaccineName} for ${result.animal_name} is due on ${dueDate}.`
        };

        createNotification(notifyData, (notifyErr, dbNotify) => {
            if (!notifyErr && dbNotify) {
                pushRealtimeNotification(req, decoded.id, decoded.role, dbNotify);
            }
        });

        res.status(201).json({ message: "Vaccination schedule created", data: result });
    });
};

// 6. Simulate payment success (invoice email + success alerts)
export const simulatePaymentSuccess = (req, res) => {
    let decoded;
    try { decoded = verifyToken(req); }
    catch (err) { return res.status(err.status || 401).json({ message: err.message }); }

    const { amount, appointmentId } = req.body;
    const orderId = req.body.orderId || `PAY-${Date.now()}`;

    if (!amount || !appointmentId) {
        return res.status(400).json({ message: "amount and appointmentId are required" });
    }

    // Retrieve appointment details to load related parties
    getAppointmentById(appointmentId, (err, results) => {
        if (err || !results || results.length === 0) {
            console.error("Failed to find appointment for payment:", err);
            return res.status(404).json({ message: "Appointment details not found" });
        }

        const appointment = results[0];
        const petOwnerId = appointment.pet_owner_id;
        const vetId = appointment.veterinarian_id;
        const animalId = appointment.animal_id;

        // Fetch pet owner and veterinarian full profiles/emails
        getUserByIdAndRole(petOwnerId, 'farmer', (errOwner, ownerUser) => {
            getUserByIdAndRole(vetId, 'doctor', (errVet, vetUser) => {
                if (errOwner || !ownerUser || errVet || !vetUser) {
                    return res.status(500).json({ message: "Failed to load profiles for notifications" });
                }

                // 1. Create In-App Notification for Owner
                const ownerNotification = {
                    userId: petOwnerId,
                    userRole: "Farmer/PetOwner",
                    type: "payment_success",
                    title: "Payment Successful",
                    message: `LKR ${parseFloat(amount).toFixed(2)} payment was successful. Receipt generated for appointment #${appointmentId}.`
                };

                createNotification(ownerNotification, (nErr, dbNotify) => {
                    if (!nErr && dbNotify) {
                        pushRealtimeNotification(req, petOwnerId, "Farmer/PetOwner", dbNotify);
                    }
                });

                // 2. Create In-App Notification for Vet
                const vetNotification = {
                    userId: vetId,
                    userRole: "Veterinary Doctor",
                    type: "payment_received",
                    title: "Payment Received",
                    message: `LKR ${parseFloat(amount).toFixed(2)} consultation fee received from ${ownerUser.fullName} for appointment #${appointmentId}.`
                };

                createNotification(vetNotification, (nErr, dbNotify) => {
                    if (!nErr && dbNotify) {
                        pushRealtimeNotification(req, vetId, "Veterinary Doctor", dbNotify);
                    }
                });

                // 3. Send Email Invoice to Owner
                const formattedDate = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                // We need to fetch animal name. We can query or use a default.
                // Let's query animal name:
                db.query("SELECT name FROM animals WHERE id = ?", [animalId], (errAnimal, animalRows) => {
                    const animalName = (!errAnimal && animalRows[0]) ? animalRows[0].name : "your animal";

                    const invoiceHtml = getInvoiceTemplate(
                        ownerUser.fullName,
                        amount,
                        orderId,
                        formattedDate,
                        animalName,
                        vetUser.fullName
                    );

                    sendEmail({
                        to: ownerUser.email,
                        subject: `Invoice / Payment Receipt - VetCloud #${orderId}`,
                        html: invoiceHtml,
                        text: `Dear ${ownerUser.fullName}, your payment of LKR ${amount} for consultation with Dr. ${vetUser.fullName} was successful.`
                    }).catch(console.error);
                });

                res.status(200).json({
                    message: "Payment successfully simulated",
                    orderId,
                    amount
                });
            });
        });
    });
};

// 7. Trigger Account Verification Email
export const sendVerificationEmail = (req, res) => {
    let decoded;
    try { decoded = verifyToken(req); }
    catch (err) { return res.status(err.status || 401).json({ message: err.message }); }

    getUserByIdAndRole(decoded.id, decoded.role === 'Veterinary Doctor' || decoded.role === 'doctor' ? 'doctor' : 'farmer', (err, user) => {
        if (err || !user) {
            return res.status(404).json({ message: "User not found" });
        }

        const html = getAccountVerificationTemplate(user.fullName, user.email);

        sendEmail({
            to: user.email,
            subject: "Verify your VetCloud Account",
            html,
            text: `Welcome to VetCloud, ${user.fullName}! Verify your account by visiting the verification link.`
        })
        .then(() => {
            res.status(200).json({ message: "Verification email sent successfully" });
        })
        .catch((emailErr) => {
            console.error(emailErr);
            res.status(500).json({ message: "Failed to send email", error: emailErr.message });
        });
    });
};

// 8. Handle Account Verification click
export const verifyEmailToken = (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    // Update verified status in pet_owners
    const sqlOwner = "UPDATE pet_owners SET isEmailVerified = 1 WHERE email = ?";
    db.query(sqlOwner, [email], (err, resultOwner) => {
        if (err) {
            return res.status(500).json({ message: "Database error during verification" });
        }

        if (resultOwner.affectedRows > 0) {
            return res.status(200).json({ message: "Account email verified successfully!" });
        }

        // If not found in pet_owners, try veterinarians
        const sqlVet = "UPDATE veterinarians SET isEmailVerified = 1 WHERE email = ?";
        db.query(sqlVet, [email], (err2, resultVet) => {
            if (err2) {
                return res.status(500).json({ message: "Database error during verification" });
            }

            if (resultVet.affectedRows > 0) {
                return res.status(200).json({ message: "Account email verified successfully!" });
            }

            return res.status(404).json({ message: "Account with this email not found" });
        });
    });
};

// ==========================================
// NOTIFICATION DISPATCH HOOKS FOR CONTROLLERS
// ==========================================

export const triggerAppointmentNotification = (app, appointmentId, triggerType) => {
    const io = app.get("io");

    const sql = `
        SELECT a.*, 
               po.fullName AS owner_name, po.email AS owner_email,
               v.fullName AS vet_name, v.email AS vet_email,
               an.name AS animal_name
        FROM appointments a
        JOIN pet_owners po ON a.pet_owner_id = po.id
        JOIN veterinarians v ON a.veterinarian_id = v.id
        JOIN animals an ON a.animal_id = an.id
        WHERE a.id = ?
    `;

    db.query(sql, [appointmentId], (err, results) => {
        if (err || !results || results.length === 0) {
            console.error(`[HOOK ERROR] Failed to fetch appointment details for notification:`, err);
            return;
        }

        const apt = results[0];
        
        // Slot query with fallback to vet_schedule / appointments
        const processNotificationWithSlot = (slotDate, slotTime) => {
            let formattedDate = "";
            if (slotDate) {
                try {
                    formattedDate = new Date(slotDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
                } catch {
                    formattedDate = String(slotDate);
                }
            }
            const formattedTime = slotTime || "";

            let ownerNotify = null;
            let vetNotify = null;
            let emailToOwner = null;
            let emailToVet = null;

            if (triggerType === "appointment_requested") {
                ownerNotify = {
                    userId: apt.pet_owner_id,
                    userRole: "Farmer/PetOwner",
                    type: "appointment_assigned",
                    title: "Appointment Requested",
                    message: `Your appointment request for ${apt.animal_name} with Dr. ${apt.vet_name} is pending approval.`
                };
                vetNotify = {
                    userId: apt.veterinarian_id,
                    userRole: "Veterinary Doctor",
                    type: "appointment_assigned",
                    title: "New Consultation Request",
                    message: `You have a new consultation request from ${apt.owner_name} for ${apt.animal_name}.`
                };
                emailToOwner = {
                    subject: "Appointment Request Submitted - VetCloud",
                    html: `<h3>Appointment Request Submitted</h3><p>Dear ${apt.owner_name}, your request to consult Dr. ${apt.vet_name} for ${apt.animal_name} is pending approval.</p>`,
                    text: `Dear ${apt.owner_name}, your appointment request is pending.`
                };
                emailToVet = {
                    subject: "New Consultation Assignment - VetCloud",
                    html: getNewConsultationAssignmentTemplate(apt.vet_name, apt.owner_name, apt.animal_name, slot.slot_date, slot.slot_time),
                    text: `Dear Dr. ${apt.vet_name}, a new consultation has been assigned to you by ${apt.owner_name}.`
                };
            } 
            else if (triggerType === "appointment_confirmed") {
                ownerNotify = {
                    userId: apt.pet_owner_id,
                    userRole: "Farmer/PetOwner",
                    type: "appointment_confirmed",
                    title: "Appointment Confirmed",
                    message: `Dr. ${apt.vet_name} confirmed your appointment for ${apt.animal_name} on ${formattedDate} at ${formattedTime}.`
                };
                // Extra in-app alert for vet assignment
                const vetAssignedNotify = {
                    userId: apt.pet_owner_id,
                    userRole: "Farmer/PetOwner",
                    type: "vet_assigned",
                    title: "Veterinarian Assigned",
                    message: `Dr. ${apt.vet_name} has been assigned to your appointment on ${formattedDate} at ${formattedTime}.`
                };
                createNotification(vetAssignedNotify, (nErr, dbNotify) => {
                    if (!nErr && dbNotify && io) {
                        io.to(`Farmer/PetOwner_${apt.pet_owner_id}`).emit("new-notification", dbNotify);
                    }
                });

                vetNotify = {
                    userId: apt.veterinarian_id,
                    userRole: "Veterinary Doctor",
                    type: "appointment_confirmed",
                    title: "Appointment Confirmed",
                    message: `You confirmed the appointment slot for ${apt.owner_name}'s animal ${apt.animal_name}.`
                };
                
                // Email confirmation details
                import("../config/email.js").then(({ getAppointmentConfirmationTemplate }) => {
                    const html = getAppointmentConfirmationTemplate(
                        apt.owner_name,
                        apt.animal_name,
                        apt.vet_name,
                        slot.slot_date,
                        formattedTime,
                        apt.consultation_type,
                        apt.reason
                    );
                    sendEmail({
                        to: apt.owner_email,
                        subject: "Appointment Confirmation Details - VetCloud",
                        html,
                        text: `Your appointment is confirmed for ${formattedDate} at ${formattedTime}.`
                    }).catch(console.error);
                });
            } 
            else if (triggerType === "appointment_rescheduled") {
                ownerNotify = {
                    userId: apt.pet_owner_id,
                    userRole: "Farmer/PetOwner",
                    type: "appointment_rescheduled",
                    title: "Appointment Rescheduled",
                    message: `You resubmitted the appointment request with new availability slots for ${apt.animal_name}.`
                };
                vetNotify = {
                    userId: apt.veterinarian_id,
                    userRole: "Veterinary Doctor",
                    type: "appointment_rescheduled",
                    title: "Appointment Rescheduled",
                    message: `${apt.owner_name} suggested new availability slots for ${apt.animal_name}.`
                };
                emailToVet = {
                    subject: "Appointment Rescheduled - VetCloud",
                    html: `<h3>Appointment Rescheduled</h3><p>Dear Dr. ${apt.vet_name}, ${apt.owner_name} has suggested new slots for the consultation of ${apt.animal_name}. Please review on your schedule page.</p>`,
                    text: `Dear Dr. ${apt.vet_name}, ${apt.owner_name} rescheduled the appointment.`
                };
            } 
            else if (triggerType === "appointment_cancelled") {
                ownerNotify = {
                    userId: apt.pet_owner_id,
                    userRole: "Farmer/PetOwner",
                    type: "appointment_cancelled",
                    title: "Appointment Cancelled",
                    message: `Your appointment with Dr. ${apt.vet_name} for ${apt.animal_name} has been cancelled.`
                };
                vetNotify = {
                    userId: apt.veterinarian_id,
                    userRole: "Veterinary Doctor",
                    type: "appointment_cancelled",
                    title: "Appointment Cancelled",
                    message: `The appointment for ${apt.owner_name}'s animal ${apt.animal_name} has been cancelled.`
                };

                // Cancellation email to owner using HTML template
                import("../config/email.js").then(({ getAppointmentCancelledTemplate }) => {
                    const html = getAppointmentCancelledTemplate(
                        apt.owner_name,
                        apt.animal_name,
                        apt.vet_name,
                        slot.slot_date,
                        formattedTime
                    );
                    sendEmail({
                        to: apt.owner_email,
                        subject: `Appointment Cancelled - VetCloud #${appointmentId}`,
                        html,
                        text: `Dear ${apt.owner_name}, your appointment with Dr. ${apt.vet_name} has been cancelled.`
                    }).catch(console.error);
                });

                emailToVet = {
                    subject: `Appointment Cancelled - VetCloud #${appointmentId}`,
                    html: `<p>Dear Dr. ${apt.vet_name}, the appointment for ${apt.owner_name}'s animal ${apt.animal_name} has been cancelled.</p>`,
                    text: `Dear Dr. ${apt.vet_name}, the appointment was cancelled.`
                };
            } 
            else if (triggerType === "appointment_completed") {
                // 1. In-app notification for Medical Report Delivery
                const medicalReportNotify = {
                    userId: apt.pet_owner_id,
                    userRole: "Farmer/PetOwner",
                    type: "medical_report_delivered",
                    title: "Medical Report Delivered",
                    message: `Dr. ${apt.vet_name} has delivered the clinical report & prescription for ${apt.animal_name}.`
                };
                createNotification(medicalReportNotify, (nErr, dbNotify) => {
                    if (!nErr && dbNotify && io) {
                        io.to(`Farmer/PetOwner_${apt.pet_owner_id}`).emit("new-notification", dbNotify);
                    }
                });

                // 2. In-app notification for Doctor Feedback Request
                ownerNotify = {
                    userId: apt.pet_owner_id,
                    userRole: "Farmer/PetOwner",
                    type: "feedback_request",
                    title: "Doctor's Feedback Request",
                    message: `How was your consultation with Dr. ${apt.vet_name} for ${apt.animal_name}? Please share your rating and review!`
                };

                vetNotify = {
                    userId: apt.veterinarian_id,
                    userRole: "Veterinary Doctor",
                    type: "appointment_completed",
                    title: "Appointment Completed",
                    message: `Your consultation for ${apt.animal_name} has been marked as completed.`
                };

                // 3. Email invitation for Doctor Feedback Request
                import("../config/email.js").then(({ getFeedbackRequestTemplate }) => {
                    const html = getFeedbackRequestTemplate(
                        apt.owner_name,
                        apt.vet_name,
                        apt.animal_name,
                        appointmentId
                    );
                    sendEmail({
                        to: apt.owner_email,
                        subject: `Feedback Request: Rate Your Consultation with Dr. ${apt.vet_name}`,
                        html,
                        text: `Dear ${apt.owner_name}, please rate your consultation experience with Dr. ${apt.vet_name} for ${apt.animal_name}.`
                    }).catch(console.error);
                });
            }

            // Save In-App notifications & Push socket updates
            if (ownerNotify) {
                createNotification(ownerNotify, (nErr, dbNotify) => {
                    if (!nErr && dbNotify) {
                        if (io) io.to(`Farmer/PetOwner_${apt.pet_owner_id}`).emit("new-notification", dbNotify);
                    }
                });
            }
            if (vetNotify) {
                createNotification(vetNotify, (nErr, dbNotify) => {
                    if (!nErr && dbNotify) {
                        if (io) io.to(`Veterinary Doctor_${apt.veterinarian_id}`).emit("new-notification", dbNotify);
                    }
                });
            }

            // Send Emails
            if (emailToOwner) {
                sendEmail({
                    to: apt.owner_email,
                    subject: emailToOwner.subject,
                    html: emailToOwner.html,
                    text: emailToOwner.text
                }).catch(console.error);
            }
            if (emailToVet) {
                sendEmail({
                    to: apt.vet_email,
                    subject: emailToVet.subject,
                    html: emailToVet.html,
                    text: emailToVet.text
                }).catch(console.error);
            }
        });
    });
};

export const triggerHistoryNotification = (app, historyId, actionType) => {
    const io = app.get("io");

    const sql = `
        SELECT h.*, a.name AS animal_name, a.owner_id, po.fullName AS owner_name, po.email AS owner_email
        FROM animal_medical_histories h
        JOIN animals a ON h.animal_id = a.id
        JOIN pet_owners po ON a.owner_id = po.id
        WHERE h.id = ?
    `;

    db.query(sql, [historyId], (err, results) => {
        if (err || !results || results.length === 0) {
            console.error(`[HOOK ERROR] Failed to fetch medical history details:`, err);
            return;
        }

        const rec = results[0];
        let ownerNotify = null;
        let emailSubject = "";

        if (rec.type === "Prescription") {
            ownerNotify = {
                userId: rec.owner_id,
                userRole: "Farmer/PetOwner",
                type: "prescription_available",
                title: "Prescription Available",
                message: `Prescription available: Dr. ${rec.vet} uploaded a new prescription for ${rec.animal_name}.`
            };
            emailSubject = `Prescription Available - ${rec.animal_name}`;
        } 
        else if (rec.type === "Diagnostic" || rec.type === "Test Result") {
            ownerNotify = {
                userId: rec.owner_id,
                userRole: "Farmer/PetOwner",
                type: "test_results",
                title: "Test Results Available",
                message: `Test results available: Medical reports/test results for ${rec.animal_name} are ready.`
            };
            emailSubject = `Medical Report / Test Results Available - ${rec.animal_name}`;
        } 
        else {
            ownerNotify = {
                userId: rec.owner_id,
                userRole: "Farmer/PetOwner",
                type: "medical_updated",
                title: "Medical Record Updated",
                message: `${rec.animal_name}'s medical records have been updated by Dr. ${rec.vet}.`
            };
            emailSubject = `Medical Record Updated - ${rec.animal_name}`;
        }

        // Save In-App
        createNotification(ownerNotify, (nErr, dbNotify) => {
            if (!nErr && dbNotify) {
                if (io) io.to(`Farmer/PetOwner_${rec.owner_id}`).emit("new-notification", dbNotify);
            }
        });

        // Email templates
        import("../config/email.js").then(({ getMedicalReportTemplate }) => {
            const html = getMedicalReportTemplate(
                rec.owner_name,
                rec.animal_name,
                rec.title,
                rec.type,
                rec.notes,
                rec.vet,
                rec.date
            );

            sendEmail({
                to: rec.owner_email,
                subject: emailSubject,
                html,
                text: `Dear ${rec.owner_name}, a medical record for ${rec.animal_name} was added/updated.`
            }).catch(console.error);
        });
    });
};

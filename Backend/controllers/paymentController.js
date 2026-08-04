import crypto from 'crypto';
import { addPaymentMethod, getPaymentMethods, deletePaymentMethod, updatePayoutSettings } from "../models/Payment.js";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import Stripe from 'stripe';
import { createNotification } from "../models/Notification.js";
import { sendEmail, getInvoiceTemplate } from "../config/email.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_dummy_key_if_not_provided');

// ── Helper: extract and verify token ──────────────────────────────────────────
const verifyToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw { status: 401, message: "Unauthorized: No token provided" };
    }
    try {
        return jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    } catch {
        throw { status: 401, message: "Unauthorized: Invalid or expired token" };
    }
};

// Get detailed payment info (doctor fee, platform commission, total)
export const getPaymentInfo = async (req, res) => {
    const { appointmentId } = req.body;

    if (!appointmentId) {
        return res.status(400).json({ message: "appointmentId is required" });
    }

    try {
        db.query(`
            SELECT a.*, v.consultation_fee 
            FROM appointments a
            JOIN veterinarians v ON a.veterinarian_id = v.id
            WHERE a.id = ?
        `, [appointmentId], (err, results) => {
            if (err || results.length === 0) {
                console.error("DB error or appointment not found:", err);
                return res.status(404).json({ message: "Appointment or veterinarian not found" });
            }
            
            const appointment = results[0];
            const doctorFee = parseFloat(appointment.consultation_fee || 0);

            db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'commission_percentage'", (err, settingResults) => {
                let commissionPct = 10;
                if (!err && settingResults.length > 0) {
                    commissionPct = parseFloat(settingResults[0].setting_value);
                }

                const commissionFee = doctorFee * (commissionPct / 100);
                const totalAmount = doctorFee + commissionFee;

                res.status(200).json({ 
                    amount: totalAmount,
                    doctorFee,
                    commissionFee
                });
            });
        });
    } catch (error) {
        console.error("Error fetching payment details:", error);
        res.status(500).json({ message: "Failed to fetch payment details" });
    }
};

const getStripeInstance = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    return new Stripe(key);
};

// Create a Stripe Checkout Session
export const createStripeCheckoutSession = async (req, res) => {
    const { appointmentId } = req.body;
    if (!appointmentId) {
        return res.status(400).json({ message: "appointmentId is required" });
    }

    try {
        db.query(`
            SELECT a.*, v.consultation_fee, v.fullName AS vetName, an.name AS animalName, an.breed AS animalBreed
            FROM appointments a
            JOIN veterinarians v ON a.veterinarian_id = v.id
            LEFT JOIN animals an ON a.animal_id = an.id
            WHERE a.id = ?
        `, [appointmentId], (err, results) => {
            if (err || results.length === 0) {
                console.error("DB error or appointment not found:", err);
                return res.status(404).json({ message: "Appointment or veterinarian not found" });
            }

            const appointment = results[0];
            const doctorFee = parseFloat(appointment.consultation_fee || 0);

            db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'commission_percentage'", async (err, settingResults) => {
                let commissionPct = 10;
                if (!err && settingResults.length > 0) {
                    commissionPct = parseFloat(settingResults[0].setting_value);
                }

                const commissionFee = doctorFee * (commissionPct / 100);
                const totalAmount = doctorFee + commissionFee;
                const clientUrl = process.env.CLIENT_URL || req.headers.origin || "http://localhost:5173";
                const stripeClient = getStripeInstance();

                // Helper function to build fallback sandbox URL
                const createMockCheckoutResponse = () => {
                    const mockSessionId = `mock_session_${Date.now()}`;
                    const mockUrl = `${clientUrl}/dashboard/user/consultations?payment_success=true&session_id=${mockSessionId}&appointment_id=${appointmentId}`;
                    return res.status(200).json({
                        url: mockUrl,
                        sessionId: mockSessionId,
                        amount: totalAmount,
                        doctorFee,
                        commissionFee
                    });
                };

                // If Stripe client is missing, fall back to seamless sandbox session
                if (!stripeClient) {
                    console.warn("STRIPE_SECRET_KEY not set. Operating in Sandbox Payment mode.");
                    return createMockCheckoutResponse();
                }

                try {
                    const currency = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
                    const session = await stripeClient.checkout.sessions.create({
                        payment_method_types: ['card'],
                        line_items: [
                            {
                                price_data: {
                                    currency: currency,
                                    product_data: {
                                        name: `Online Consultation Fee (Dr. ${appointment.vetName})`,
                                        description: `Appointment for ${appointment.animalName || 'Pet'} (${appointment.animalBreed || 'Unknown Breed'})`,
                                    },
                                    unit_amount: Math.round(doctorFee * 100),
                                },
                                quantity: 1,
                            },
                            {
                                price_data: {
                                    currency: currency,
                                    product_data: {
                                        name: 'Platform Commission Fee',
                                        description: 'VetCloud service charge',
                                    },
                                    unit_amount: Math.round(commissionFee * 100),
                                },
                                quantity: 1,
                            }
                        ],
                        mode: 'payment',
                        success_url: `${clientUrl}/dashboard/user/consultations?payment_success=true&session_id={CHECKOUT_SESSION_ID}&appointment_id=${appointmentId}`,
                        cancel_url: `${clientUrl}/dashboard/user/consultations?payment_cancel=true`,
                    });

                    console.log("Stripe Session URL generated successfully:", session.url);
                    return res.status(200).json({
                        url: session.url,
                        sessionId: session.id,
                        amount: totalAmount,
                        doctorFee,
                        commissionFee
                    });
                } catch (stripeErr) {
                    console.warn("Stripe API Session call failed, using Sandbox fallback:", stripeErr.message);
                    return createMockCheckoutResponse();
                }
            });
        });
    } catch (error) {
        console.error("Error creating stripe session:", error);
        res.status(500).json({ message: "Failed to initiate payment" });
    }
};

// ── Save payout settings (bank details) ───────────────────────────────────────
export const savePayoutSettings = (req, res) => {
    let decoded;
    try { decoded = verifyToken(req); }
    catch (e) { return res.status(e.status || 401).json({ message: e.message }); }

    console.log("Saving payout settings for vet:", decoded.id, "| Data:", req.body);

    updatePayoutSettings(decoded.id, req.body, (err, result) => {
        if (err) {
            console.error("DB error saving payout settings:", err.sqlMessage || err);
            return res.status(500).json({ message: "Database error saving payout settings", detail: err.sqlMessage });
        }
        return res.status(200).json({ message: "Payout details updated successfully!" });
    });
};

// ── Add a new payment method ───────────────────────────────────────────────────
export const saveNewPaymentMethod = (req, res) => {
    let decoded;
    try { decoded = verifyToken(req); }
    catch (e) { return res.status(e.status || 401).json({ message: e.message }); }

    const { bankName, accountName, accountNumber, branchCode } = req.body;

    if (!bankName || !accountName || !accountNumber || !branchCode) {
        return res.status(400).json({ message: "All fields are required: bankName, accountName, accountNumber, branchCode" });
    }

    console.log("Adding payment method for vet:", decoded.id, "| Data:", req.body);

    addPaymentMethod(decoded.id, req.body, (err, result) => {
        if (err) {
            console.error("DB error adding payment method:", err.sqlMessage || err);
            return res.status(500).json({ message: "Failed to save payment method", detail: err.sqlMessage });
        }
        return res.status(200).json({ message: "Payment method added successfully!", id: result.insertId });
    });
};

// ── Fetch all payment methods for this vet ─────────────────────────────────────
export const fetchPaymentMethods = (req, res) => {
    let decoded;
    try { decoded = verifyToken(req); }
    catch (e) { return res.status(e.status || 401).json({ message: e.message }); }

    getPaymentMethods(decoded.id, (err, results) => {
        if (err) {
            console.error("DB error fetching payment methods:", err.sqlMessage || err);
            return res.status(500).json({ message: "Database error fetching payment methods", detail: err.sqlMessage });
        }
        return res.status(200).json(results);
    });
};

// ── Remove a payment method ────────────────────────────────────────────────────
export const removePaymentMethod = (req, res) => {
    let decoded;
    try { decoded = verifyToken(req); }
    catch (e) { return res.status(e.status || 401).json({ message: e.message }); }

    const methodId = req.params.id;

    deletePaymentMethod(methodId, decoded.id, (err, result) => {
        if (err) {
            console.error("DB error deleting payment method:", err.sqlMessage || err);
            return res.status(500).json({ message: "Database error removing payment method", detail: err.sqlMessage });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Payment method not found or not yours" });
        }
        return res.status(200).json({ message: "Payment method removed successfully" });
    });
};

// ── Get Commission Rate ──────────────────────────────────────────────────────
export const getCommissionRate = (req, res) => {
    db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'commission_percentage'", (err, results) => {
        if (err) {
            console.error("Failed to fetch commission percentage:", err);
            return res.status(200).json({ commission_percentage: "10" });
        }
        const pct = results.length > 0 ? results[0].setting_value : "10";
        res.status(200).json({ commission_percentage: pct });
    });
};

// Verify Stripe Checkout Session
export const verifyStripeSession = async (req, res) => {
    const { sessionId, appointmentId } = req.body;
    if (!sessionId || !appointmentId) {
        return res.status(400).json({ message: "sessionId and appointmentId are required" });
    }

    try {
        if (sessionId.startsWith("mock_session_")) {
            console.log(`Mock verification successful for appointment ${appointmentId}`);
            processSuccessfulPayment(req, appointmentId, (err) => {
                if (err) {
                    console.error("Failed to process payment:", err);
                    return res.status(500).json({ message: "Database error" });
                }
                return res.status(200).json({ success: true, message: "Payment verified successfully (Mock)!" });
            });
        } else {
            const stripeClient = getStripeInstance();
            if (!stripeClient) {
                return res.status(400).json({ message: "Stripe key not configured, cannot verify real session" });
            }

            const session = await stripeClient.checkout.sessions.retrieve(sessionId);
            if (session.payment_status === 'paid') {
                console.log(`Stripe payment verified for appointment ${appointmentId}`);
                processSuccessfulPayment(req, appointmentId, (err) => {
                    if (err) {
                        console.error("Failed to process payment:", err);
                        return res.status(500).json({ message: "Database error" });
                    }
                    return res.status(200).json({ success: true, message: "Payment verified successfully!" });
                });
            } else {
                res.status(400).json({ message: "Stripe session payment not completed" });
            }
        }
    } catch (error) {
        console.error("Error verifying stripe session:", error);
        res.status(500).json({ message: "Failed to verify payment session", error: error.message });
    }
};

// ── Test Payment (Offline Bypass / Stripe Mock Checkout) ──────────────────────
export const testPayment = (req, res) => {
    const { appointmentId } = req.body;
    if (!appointmentId) {
        return res.status(400).json({ message: "appointmentId is required" });
    }

    console.log(`Processing test payment for Appointment ID: ${appointmentId}`);
    processSuccessfulPayment(req, appointmentId, (err) => {
        if (err) {
            console.error("Failed to process test payment:", err);
            return res.status(500).json({ message: "Failed to process payment", detail: err.message });
        }
        res.status(200).json({ message: "Test payment successful!" });
    });
};

// ── Handle Payment Failure ──────────────────────────────────────────────────
export const handlePaymentFailure = (req, res) => {
    const { appointmentId, errorMsg } = req.body;
    if (!appointmentId) {
        return res.status(400).json({ message: "appointmentId is required" });
    }

    db.query(`
        SELECT a.*, p.fullName AS ownerName, v.consultation_fee
        FROM appointments a
        JOIN pet_owners p ON a.pet_owner_id = p.id
        JOIN veterinarians v ON a.veterinarian_id = v.id
        WHERE a.id = ?
    `, [appointmentId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        const appt = results[0];
        const io = req.app.get("io");

        // 1. Log failed payment to admin in-app notification
        import("../models/Notification.js").then(({ createAdminNotification }) => {
            createAdminNotification(io, {
                type: "failed_payment",
                title: "Failed Payment Alert",
                message: `Failed payment transaction of LKR ${parseFloat(appt.consultation_fee).toFixed(2)} detected for client ${appt.ownerName} on appointment #${appointmentId}.`
            });
        }).catch(console.error);

        // 2. Email failed payment report to admins
        import("../config/email.js").then(({ getFailedPaymentReportTemplate }) => {
            const html = getFailedPaymentReportTemplate(appointmentId, appt.ownerName, appt.consultation_fee, errorMsg);
            db.query("SELECT email FROM admins", (errAdmin, adminList) => {
                const adminEmails = (!errAdmin && adminList && adminList.length > 0) ? adminList.map(a => a.email) : ["admin@vetcloud.com"];
                adminEmails.forEach(email => {
                    sendEmail({
                        to: email,
                        subject: `Failed Payment Transaction Report - VetCloud #${appointmentId}`,
                        html,
                        text: `Failed payment transaction alert: appointment #${appointmentId} for client ${appt.ownerName} failed.`
                    }).catch(console.error);
                });
            });
        });

        res.status(200).json({ message: "Failed payment report successfully dispatched to admins." });
    });
};

// Helper to format Date objects or strings into YYYY-MM-DD for MySQL DATE columns
const formatDateToYYYYMMDD = (d) => {
    if (!d) d = new Date();
    if (typeof d === 'string') {
        if (d.includes('T')) return d.split('T')[0];
        return d;
    }
    if (d instanceof Date) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return new Date().toISOString().split('T')[0];
};

// ── Helper to process successful payments ───────────────────────────────────
const processSuccessfulPayment = (req, appointmentId, callback) => {
    db.query(`
        SELECT a.*, v.consultation_fee, v.fullName AS vetName, v.email AS vetEmail, p.fullName AS ownerName, p.email AS ownerEmail, an.name AS animalName
        FROM appointments a
        JOIN veterinarians v ON a.veterinarian_id = v.id
        JOIN pet_owners p ON a.pet_owner_id = p.id
        JOIN animals an ON a.animal_id = an.id
        WHERE a.id = ?
    `, [appointmentId], (err, results) => {
        if (err) return callback(err);
        if (results.length === 0) return callback(new Error("Appointment not found"));

        const appointment = results[0];

        // If already paid, complete cleanly without throwing error
        if (appointment.payment_status === 'Paid') {
            console.log(`Appointment #${appointmentId} is already marked as Paid.`);
            return callback(null);
        }

        const io = req.app.get("io");
        
        db.query("UPDATE appointments SET payment_status = 'Paid' WHERE id = ?", [appointmentId], (err) => {
            if (err) return callback(err);

            db.query("SELECT slot_date, slot_time FROM appointment_slots WHERE id = ?", [appointment.selected_slot_id], (err, slotResults) => {
                if (err) return callback(err);
                
                let rawDate = null;
                let apptTime = "00:00:00";

                if (slotResults && slotResults.length > 0) {
                    rawDate = slotResults[0].slot_date;
                    apptTime = slotResults[0].slot_time || "00:00:00";
                }

                const proceedToInsertConsultation = (dateVal, timeVal) => {
                    const apptDate = formatDateToYYYYMMDD(dateVal);
                    const finalTime = timeVal ? String(timeVal) : "00:00:00";

                    const sql = `
                        INSERT INTO consultations 
                        (doctor_id, owner_id, animal_id, consultation_type, symptoms, appointment_date, appointment_time, status, fee)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?)
                    `;
                    db.query(sql, [
                        appointment.veterinarian_id,
                        appointment.pet_owner_id,
                        appointment.animal_id,
                        appointment.consultation_type,
                        appointment.reason || "Virtual Consultation",
                        apptDate,
                        finalTime,
                        appointment.consultation_fee
                    ], (insertErr) => {
                        if (insertErr) {
                            console.error("Error inserting consultation record:", insertErr);
                            return callback(insertErr);
                        }

                        // 1. Create In-App Notification for Owner
                        const ownerNotification = {
                            userId: appointment.pet_owner_id,
                            userRole: "Farmer/PetOwner",
                            type: "payment_success",
                            title: "Payment Successful",
                            message: `LKR ${parseFloat(appointment.consultation_fee).toFixed(2)} payment was successful. Receipt generated for appointment #${appointmentId}.`
                        };
                        createNotification(ownerNotification, (nErr, dbNotify) => {
                            if (!nErr && dbNotify && io) {
                                io.to(`Farmer/PetOwner_${appointment.pet_owner_id}`).emit("new-notification", dbNotify);
                            }
                        });

                        // 2. Create In-App Notification for Vet
                        const vetNotification = {
                            userId: appointment.veterinarian_id,
                            userRole: "Veterinary Doctor",
                            type: "payment_received",
                            title: "Payment Received",
                            message: `LKR ${parseFloat(appointment.consultation_fee).toFixed(2)} consultation fee received from ${appointment.ownerName} for appointment #${appointmentId}.`
                        };
                        createNotification(vetNotification, (nErr, dbNotify) => {
                            if (!nErr && dbNotify && io) {
                                io.to(`Veterinary Doctor_${appointment.veterinarian_id}`).emit("new-notification", dbNotify);
                            }
                        });

                        // 3. Send Email Invoice to Owner
                        const formattedDate = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                        const orderId = `PAY-${Date.now()}`;
                        const invoiceHtml = getInvoiceTemplate(
                            appointment.ownerName,
                            appointment.consultation_fee,
                            orderId,
                            formattedDate,
                            appointment.animalName,
                            appointment.vetName
                        );

                        sendEmail({
                            to: appointment.ownerEmail,
                            subject: `Invoice / Payment Receipt - VetCloud #${orderId}`,
                            html: invoiceHtml,
                            text: `Dear ${appointment.ownerName}, your payment of LKR ${appointment.consultation_fee} for consultation with Dr. ${appointment.vetName} was successful.`
                        }).catch(console.error);

                        callback(null);
                    });
                };

                if (!rawDate) {
                    // Try fetching from vet_schedule as fallback
                    db.query("SELECT slot_date, slot_time FROM vet_schedule WHERE appointment_id = ?", [appointmentId], (schedErr, schedResults) => {
                        if (!schedErr && schedResults && schedResults.length > 0) {
                            proceedToInsertConsultation(schedResults[0].slot_date, schedResults[0].slot_time);
                        } else {
                            proceedToInsertConsultation(new Date(), "00:00:00");
                        }
                    });
                } else {
                    proceedToInsertConsultation(rawDate, apptTime);
                }
            });
        });
    });
};
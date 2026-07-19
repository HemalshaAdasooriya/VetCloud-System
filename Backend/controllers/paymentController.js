import crypto from 'crypto';
import { addPaymentMethod, getPaymentMethods, deletePaymentMethod, updatePayoutSettings } from "../models/Payment.js";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

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

// Secure PayHere hash generator
export const generatePaymentHash = async (req, res) => {
    const merchantId = process.env.PAYHERE_MERCHANT_ID || process.env.MERCHANT_ID || "1236188";
    const merchantSecret = process.env.PAYHERE_SECRET || "MjMxOTc5MjIxNDI4NTYyMTMyMTAzODgyNjk4MTcyMjA2NDM3MjA3NQ==";
    const { orderId, currency } = req.body; // orderId is appointmentId

    if (!orderId) {
        return res.status(400).json({ message: "orderId (appointmentId) is required" });
    }

    try {
        db.query(`
            SELECT a.*, v.consultation_fee 
            FROM appointments a
            JOIN veterinarians v ON a.veterinarian_id = v.id
            WHERE a.id = ?
        `, [orderId], (err, results) => {
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

                const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
                const amountFormatted = parseFloat(totalAmount).toLocaleString('en-us', { minimumFractionDigits: 2 }).replaceAll(',', '');
                const hashString = merchantId + orderId + amountFormatted + (currency || "LKR") + hashedSecret;
                const finalHash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

                res.status(200).json({ 
                    hash: finalHash, 
                    amount: totalAmount,
                    doctorFee,
                    commissionFee,
                    merchantId
                });
            });
        });
    } catch (error) {
        console.error("Error generating payment hash:", error);
        res.status(500).json({ message: "Failed to generate payment hash" });
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

// ── PayHere Notification Webhook ─────────────────────────────────────────────
export const payhereNotify = (req, res) => {
    const {
        merchant_id,
        order_id,
        payment_id,
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig
    } = req.body;

    console.log("Received PayHere notification:", req.body);

    const merchantSecret = process.env.PAYHERE_SECRET || "MjMxOTc5MjIxNDI4NTYyMTMyMTAzODgyNjk4MTcyMjA2NDM3MjA3NQ==";
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    
    const localSigString = merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret;
    const localSig = crypto.createHash('md5').update(localSigString).digest('hex').toUpperCase();

    if (localSig !== md5sig) {
        console.error("PayHere signature verification failed!");
        return res.status(400).send("Invalid signature");
    }

    if (status_code === "2") {
        console.log(`PayHere Payment Successful for Appointment ID: ${order_id}, Transaction ID: ${payment_id}`);
        processSuccessfulPayment(order_id, (err) => {
            if (err) {
                console.error("Failed to process payment:", err);
                return res.status(500).send("Database error");
            }
            return res.status(200).send("OK");
        });
    } else {
        console.log(`PayHere notification with status code: ${status_code}`);
        return res.status(200).send("Status is not successful");
    }
};

// ── Test Payment (Offline Bypass / Stripe Mock Checkout) ──────────────────────
export const testPayment = (req, res) => {
    const { appointmentId } = req.body;
    if (!appointmentId) {
        return res.status(400).json({ message: "appointmentId is required" });
    }

    console.log(`Processing test payment for Appointment ID: ${appointmentId}`);
    processSuccessfulPayment(appointmentId, (err) => {
        if (err) {
            console.error("Failed to process test payment:", err);
            return res.status(500).json({ message: "Failed to process payment", detail: err.message });
        }
        res.status(200).json({ message: "Test payment successful!" });
    });
};

// ── Helper to process successful payments ───────────────────────────────────
const processSuccessfulPayment = (appointmentId, callback) => {
    db.query(`
        SELECT a.*, v.consultation_fee, v.fullName AS vetName, p.fullName AS ownerName 
        FROM appointments a
        JOIN veterinarians v ON a.veterinarian_id = v.id
        JOIN pet_owners p ON a.pet_owner_id = p.id
        WHERE a.id = ?
    `, [appointmentId], (err, results) => {
        if (err) return callback(err);
        if (results.length === 0) return callback(new Error("Appointment not found"));

        const appointment = results[0];
        
        db.query("UPDATE appointments SET payment_status = 'Paid' WHERE id = ?", [appointmentId], (err) => {
            if (err) return callback(err);

            db.query("SELECT slot_date, slot_time FROM appointment_slots WHERE id = ?", [appointment.selected_slot_id], (err, slotResults) => {
                if (err) return callback(err);
                
                const slot = slotResults[0];
                const apptDate = slot ? slot.slot_date : new Date();
                const apptTime = slot ? slot.slot_time : "00:00:00";

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
                    apptTime,
                    appointment.consultation_fee
                ], (err) => {
                    if (err) return callback(err);
                    callback(null);
                });
            });
        });
    });
};
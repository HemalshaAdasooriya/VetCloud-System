import crypto from 'crypto';
import { addPaymentMethod, getPaymentMethods, deletePaymentMethod, updatePayoutSettings } from "../models/Payment.js";
import jwt from "jsonwebtoken";

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

// PayHere hash generator 
export const generatePaymentHash = (req, res) => {
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_SECRET;
    const { orderId, amount, currency } = req.body;

    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const amountFormatted = parseFloat(amount).toLocaleString('en-us', { minimumFractionDigits: 2 }).replaceAll(',', '');
    const hashString = merchantId + orderId + amountFormatted + currency + hashedSecret;
    const finalHash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

    res.status(200).json({ hash: finalHash });
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
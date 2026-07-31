import db from "../config/db.js";

export const updatePayoutSettings = (vetId, payoutData, callback) => {
    // We use an UPSERT: Insert if new, Update if already exists
    const sql = `
        INSERT INTO veterinarian_bank_details 
        (vet_id, bank_name, account_name, account_number, branch_code, payout_schedule, minimum_payout)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            bank_name = VALUES(bank_name),
            account_name = VALUES(account_name),
            account_number = VALUES(account_number),
            branch_code = VALUES(branch_code),
            payout_schedule = VALUES(payout_schedule),
            minimum_payout = VALUES(minimum_payout)
    `;

    const values = [
        vetId,
        payoutData.bankName || "",
        payoutData.accountName || "",
        payoutData.accountNumber || "",
        payoutData.branchCode || "",
        payoutData.schedule || "weekly",
        parseInt(payoutData.minimumPayout) || 1000
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Bank Details Database Error:", err);
            return callback(err, null);
        }
        callback(null, { message: "Bank and payout settings saved successfully" });
    });
};


// --- MULTIPLE PAYMENT METHODS LOGIC ---

export const addPaymentMethod = (vetId, data, callback) => {
    const sql = `
        INSERT INTO veterinarian_payment_methods 
        (vet_id, bank_name, account_name, account_number, branch_code) 
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [vetId, data.bankName, data.accountName, data.accountNumber, data.branchCode], callback);
};

export const getPaymentMethods = (vetId, callback) => {
    const sql = `SELECT * FROM veterinarian_payment_methods WHERE vet_id = ? ORDER BY created_at DESC`;
    db.query(sql, [vetId], callback);
};

export const deletePaymentMethod = (methodId, vetId, callback) => {
    // We check vet_id to ensure a doctor can only delete their own payment methods
    const sql = `DELETE FROM veterinarian_payment_methods WHERE id = ? AND vet_id = ?`;
    db.query(sql, [methodId, vetId], callback);
};
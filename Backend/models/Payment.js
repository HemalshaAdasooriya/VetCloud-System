import db from "../config/db.js";

export const updatePayoutSettings = (vetId, payoutData, callback) => {
    // We use an UPSERT: Insert if new, Update if already exists
    const sql = `
        INSERT INTO veterinarian_bank_details 
        (vet_id, bank_name, account_name, account_number, branch_code, payout_schedule)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            bank_name = VALUES(bank_name),
            account_name = VALUES(account_name),
            account_number = VALUES(account_number),
            branch_code = VALUES(branch_code),
            payout_schedule = VALUES(payout_schedule)
    `;

    const values = [
        vetId,
        payoutData.bankName || "",
        payoutData.accountName || "",
        payoutData.accountNumber || "",
        payoutData.branchCode || "",
        payoutData.schedule || "weekly"
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Bank Details Database Error:", err);
            return callback(err, null);
        }
        callback(null, { message: "Bank and payout settings saved successfully" });
    });
};
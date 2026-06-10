// A simple example of the Node.js Hash Generator
import crypto from 'crypto';

export const generatePaymentHash = (req, res) => {
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_SECRET;
    const { orderId, amount, currency } = req.body;

    // The specific mathematical formula PayHere requires for the "Wax Stamp"
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const amountFormatted = parseFloat(amount).toLocaleString('en-us', { minimumFractionDigits: 2 }).replaceAll(',', '');
    const hashString = merchantId + orderId + amountFormatted + currency + hashedSecret;
    
    const finalHash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

    res.status(200).json({ hash: finalHash });
};

export const savePayoutSettings = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Let's print exactly what React is sending to Node!
        console.log("REACT SENT THIS DATA:", req.body);
        console.log("USER ID IS:", decoded.id);
        
        updatePayoutSettings(decoded.id, req.body, (err, result) => {
            if (err) {
                // Let's print exactly why MySQL is failing!
                console.error("MYSQL REJECTED IT BECAUSE:", err.sqlMessage);
                return res.status(500).json({ message: "Database error saving payouts" });
            }
            return res.status(200).json({ message: "Payout details updated successfully!" });
        });
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
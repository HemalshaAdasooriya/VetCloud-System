// routes/paymentRouter.js
import express from "express";
import { 
    generatePaymentHash, 
    savePayoutSettings, 
    saveNewPaymentMethod, 
    fetchPaymentMethods, 
    removePaymentMethod,
    getCommissionRate,
    payhereNotify,
    testPayment
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

// Route for generating the PayHere hash
paymentRouter.post("/hash", generatePaymentHash);

// Route for saving the veterinarian bank details
paymentRouter.post("/payout-settings", savePayoutSettings);

// Route for managing payment methods
paymentRouter.post("/payment-methods", saveNewPaymentMethod);
paymentRouter.get("/payment-methods", fetchPaymentMethods);
paymentRouter.delete("/payment-methods/:id", removePaymentMethod);

// Commission & Payment Gateway hooks
paymentRouter.get("/commission", getCommissionRate);
paymentRouter.post("/notify", payhereNotify);
paymentRouter.post("/test-payment", testPayment);

export default paymentRouter;
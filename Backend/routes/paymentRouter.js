// routes/paymentRouter.js
import express from "express";
import { generatePaymentHash, savePayoutSettings, saveNewPaymentMethod, fetchPaymentMethods, removePaymentMethod } from "../controllers/paymentController.js";

const paymentRouter = express.Router();

// Route for generating the PayHere hash
paymentRouter.post("/hash", generatePaymentHash);

// Route for saving the veterinarian bank details
paymentRouter.post("/payout-settings", savePayoutSettings);

// Route for managing payment methods
paymentRouter.post("/payment-methods", saveNewPaymentMethod);
paymentRouter.get("/payment-methods", fetchPaymentMethods);
paymentRouter.delete("/payment-methods/:id", removePaymentMethod);

export default paymentRouter;
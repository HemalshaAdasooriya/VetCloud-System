// routes/paymentRouter.js
import express from "express";
import { generatePaymentHash, savePayoutSettings } from "../controllers/paymentController.js";

const paymentRouter = express.Router();

// Route for generating the PayHere hash
paymentRouter.post("/hash", generatePaymentHash);

// Route for saving the veterinarian bank details
paymentRouter.post("/payout-settings", savePayoutSettings);

export default paymentRouter;
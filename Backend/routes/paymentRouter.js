import express from "express";
import { 
    getPaymentInfo, 
    createStripeCheckoutSession,
    verifyStripeSession,
    savePayoutSettings, 
    saveNewPaymentMethod, 
    fetchPaymentMethods, 
    removePaymentMethod,
    getCommissionRate,
    testPayment,
    handlePaymentFailure
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

// Route for getting payment information
paymentRouter.post("/info", getPaymentInfo);

// Route for Stripe checkout
paymentRouter.post("/create-checkout-session", createStripeCheckoutSession);
paymentRouter.post("/verify-session", verifyStripeSession);
paymentRouter.post("/failure", handlePaymentFailure);

// Route for saving the veterinarian bank details
paymentRouter.post("/payout-settings", savePayoutSettings);

// Route for managing payment methods
paymentRouter.post("/payment-methods", saveNewPaymentMethod);
paymentRouter.get("/payment-methods", fetchPaymentMethods);
paymentRouter.delete("/payment-methods/:id", removePaymentMethod);

// Commission & Payment Gateway hooks
paymentRouter.get("/commission", getCommissionRate);
paymentRouter.post("/test-payment", testPayment);

export default paymentRouter;
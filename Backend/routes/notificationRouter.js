import express from "express";
import {
    getNotifications,
    readNotification,
    readAllNotifications,
    getVaccinations,
    addVaccination,
    simulatePaymentSuccess,
    sendVerificationEmail,
    verifyEmailToken
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

// Fetch and manage In-App Notifications
notificationRouter.get("/", getNotifications);
notificationRouter.put("/read-all", readAllNotifications);
notificationRouter.put("/:id/read", readNotification);

// Vaccination Schedules
notificationRouter.get("/vaccinations", getVaccinations);
notificationRouter.post("/vaccinations", addVaccination);

// Simulations & Account Verification Actions
notificationRouter.post("/simulate-payment", simulatePaymentSuccess);
notificationRouter.post("/send-verification", sendVerificationEmail);
notificationRouter.post("/verify-email", verifyEmailToken);

export default notificationRouter;

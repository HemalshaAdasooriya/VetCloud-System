import express from "express";

import {
    bookAppointment,
    getOwnerAppointments,
    getVetAppointments,
    getAppointment,
    approveAppointment,
    rejectAppointment,
    resubmitAppointment,
    completeAppointment,
    cancelAppointment,
    removeAppointment,
    getChatHistory
} from "../controllers/appointmentController.js";

const appointmentRouter = express.Router();

appointmentRouter.post("/", bookAppointment);

appointmentRouter.get(
    "/owner/:ownerId",
    getOwnerAppointments
);

appointmentRouter.get(
    "/vet/:vetId",
    getVetAppointments
);

appointmentRouter.get(
    "/:id",
    getAppointment
);

appointmentRouter.patch(
    "/:id/approve",
    approveAppointment
);

appointmentRouter.patch(
    "/:id/reject",
    rejectAppointment
);

appointmentRouter.patch(
    "/:id/resubmit",
    resubmitAppointment
);

appointmentRouter.patch(
    "/:id/complete",
    completeAppointment
);

appointmentRouter.patch(
    "/:id/cancel",
    cancelAppointment
);

appointmentRouter.delete(
    "/:id",
    removeAppointment
);

appointmentRouter.get(
    "/:id/chat-history",
    getChatHistory
);

export default appointmentRouter;
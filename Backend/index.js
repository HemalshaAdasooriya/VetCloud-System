import dotenv from "dotenv";
import express from "express";
import userRouter from "./routes/userRouter.js";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mapRouter from "./routes/mapRouter.js";
import animalRouter from "./routes/animalRouter.js";
import appointmentRouter from "./routes/appointmentRouter.js";
import paymentRouter from "./routes/paymentRouter.js";
import vetAppointmentRouter from "./routes/vetAppointmentRouter.js";
import { initializeNotificationTables } from "./models/Notification.js";
import notificationRouter from "./routes/notificationRouter.js";
import { startReminderScheduler } from "./config/scheduler.js";

dotenv.config();

// Create notifications table on startup
initializeNotificationTables();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Store io in express app context
app.set("io", io);

// Socket.io Logic
io.on("connection", (socket) => {
      // Socket room registration for real-time alerts
    socket.on("register", (data) => {
        if (data && data.userId && data.role) {
            const roomName = `${data.role}_${data.userId}`;
            socket.join(roomName);
            console.log(`Socket client registered and joined room: ${roomName}`);
        }
    });//isuri-notification

    socket.on("send-location", (data) => {
        io.emit("receive-location", { id: socket.id, ...data });
    });
    socket.on("disconnect", () => {
        io.emit("user-disconnected", socket.id);
    });
});

// Start Background Reminder Checks
startReminderScheduler(io);

app.use(cors());
app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/map", mapRouter);
app.use("/api/animals", animalRouter);
app.use("/api/appointments", appointmentRouter);
app.use('/api/vet-appointments', vetAppointmentRouter); //Navindu 2026/06/16 
app.use("/api/payments", paymentRouter);
app.use("/api/notifications", notificationRouter);
app.use("/uploads", express.static("uploads"));

server.listen(5000, () => {
    console.log("Server running on port 5000");
});
import dotenv from "dotenv";
dotenv.config();
import db from "./config/db.js";
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
import { initializePaymentSettingsTable } from "./models/Setting.js";
import notificationRouter from "./routes/notificationRouter.js";
import { startReminderScheduler } from "./config/scheduler.js";
import adminRouter from "./routes/adminRouter.js";
import scheduleRouter from "./routes/scheduleRouter.js";
import { seedAdminAuto } from "./seedAdmin.js";

// Create notifications table and seed admin on startup
initializeNotificationTables();
initializePaymentSettingsTable();
seedAdminAuto();

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
            const primaryRoom = `${data.role}_${data.userId}`;
            socket.join(primaryRoom);

            const lowerRole = String(data.role).toLowerCase();
            if (lowerRole.includes('farmer') || lowerRole.includes('petowner') || lowerRole.includes('owner')) {
                socket.join(`Farmer/PetOwner_${data.userId}`);
                socket.join(`farmer_${data.userId}`);
                socket.join(`pet_owner_${data.userId}`);
            } else if (lowerRole.includes('doctor') || lowerRole.includes('vet')) {
                socket.join(`Veterinary Doctor_${data.userId}`);
                socket.join(`doctor_${data.userId}`);
                socket.join(`vet_${data.userId}`);
            }

            console.log(`Socket client registered (${socket.id}) for user ${data.userId} role ${data.role}`);
        }
    });

    // Chat Room Events
    socket.on("join-chat-room", ({ appointmentId }) => {
        const roomName = `appointment_chat_${appointmentId}`;
        socket.join(roomName);
        console.log(`Socket client (${socket.id}) joined chat room: ${roomName}`);
    });

    socket.on("send-chat-message", ({ appointmentId, text, fileUrl, sender, senderName }) => {
        const roomName = `appointment_chat_${appointmentId}`;
        const sql = `
            INSERT INTO chat_messages (appointment_id, sender, sender_name, text, file_url)
            VALUES (?, ?, ?, ?, ?)
        `;
        db.query(sql, [appointmentId, sender, senderName, text || null, fileUrl || null], (err, result) => {
            if (err) {
                console.error("Failed to persist chat message:", err);
            }
            const messageId = result ? result.insertId : (Date.now() + Math.random());
            io.to(roomName).emit("receive-chat-message", {
                id: messageId,
                sender,
                senderName,
                text,
                fileUrl,
                time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
            });
        });
    });

    socket.on("voice-call-action", ({ appointmentId, action, sender, senderName }) => {
        const roomName = `appointment_chat_${appointmentId}`;
        io.to(roomName).emit("voice-call-broadcast", {
            action, // 'invite', 'accept', 'decline', 'hangup'
            sender,
            senderName
        });
    });

    socket.on("complete-consultation", ({ appointmentId, prescription }) => {
        const roomName = `appointment_chat_${appointmentId}`;
        io.to(roomName).emit("consultation-completed", { prescription });
    });

    socket.on("send-location", (data) => {
        io.emit("receive-location", { id: socket.id, ...data });
    });
    socket.on("disconnect", () => {
        io.emit("user-disconnected", socket.id);
    });
});

// Start Background Reminder Checks
startReminderScheduler(io);

app.use(cors({
    origin: ["https://vet-cloud-system.vercel.app", "http://localhost:5173", "http://localhost:3000", "http://localhost:5000"],
    credentials: true
}));

// Stripe webhook requires raw body for signature verification
app.use("/api/payments/webhook", express.raw({ type: 'application/json' }));
app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/map", mapRouter);
app.use("/api/animals", animalRouter);
app.use("/api/appointments", appointmentRouter);
app.use('/api/vet-appointments', vetAppointmentRouter); //Navindu 2026/06/16
app.use("/api/schedule", scheduleRouter); //Navindu 2026/06/26 
app.use("/api/payments", paymentRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/admin", adminRouter);
app.use("/uploads", express.static("uploads"));

// Express Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error("Express Uncaught Crash Intercepted:", err);
    import("./models/Notification.js").then(({ createSystemError, createAdminNotification }) => {
        const io = app.get("io");
        createSystemError({
            errorCode: err.code || err.name || "ROUTE_CRASH",
            message: `Unhandled Error on ${req.method} ${req.url}: ${err.message}. Stack: ${err.stack}`,
            severity: "Critical"
        }, (errLog, resultLog) => {
            if (!errLog) {
                createAdminNotification(io, {
                    type: "system_error",
                    title: "System Route Crash",
                    message: `Route crash [${err.code || err.name || "ROUTE_CRASH"}] on ${req.method} ${req.url}: ${err.message}`
                });
            }
        });
    }).catch(console.error);

    res.status(500).json({ message: "Internal server error occurred." });
});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});
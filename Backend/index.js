import dotenv from "dotenv";
import path from "path";

import express from "express";
import userRouter from "./routes/userRouter.js";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mapRouter from "./routes/mapRouter.js";

// dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Socket.io Logic
io.on("connection", (socket) => {
    socket.on("send-location", (data) => {
        io.emit("receive-location", { id: socket.id, ...data });
    });
    socket.on("disconnect", () => {
        io.emit("user-disconnected", socket.id);
    });
});

app.use(cors());
app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/map", mapRouter);

server.listen(5000, () => {
    console.log("Server running on port 5000");
});
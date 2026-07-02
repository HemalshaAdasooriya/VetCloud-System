// routes/adminRouter.js
import express from "express";
import jwt from "jsonwebtoken";
import {
    getOverviewStats,
    getUsers,
    updateUserStatus,
    deleteUser,
    getDoctors,
    updateDoctorStatus,
    deleteDoctor,
    getPayments,
    createPayout,
    getDiseases,
    createDisease,
    updateDisease,
    deleteDisease,
    getFeedback,
    deleteFeedback,
    getReports,
    updateAdminProfile
} from "../controllers/adminController.js";

const adminRouter = express.Router();

// Middleware to authenticate admin token
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "admin" && decoded.role !== "Admin") {
            return res.status(403).json({ message: "Forbidden: Admin access only" });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
};

// Overview Stats
adminRouter.get("/overview", authenticateAdmin, getOverviewStats);

// User Management
adminRouter.get("/users", authenticateAdmin, getUsers);
adminRouter.put("/users/:id/status", authenticateAdmin, updateUserStatus);
adminRouter.delete("/users/:id", authenticateAdmin, deleteUser);

// Doctor Management
adminRouter.get("/doctors", authenticateAdmin, getDoctors);
adminRouter.put("/doctors/:id/status", authenticateAdmin, updateDoctorStatus);
adminRouter.delete("/doctors/:id", authenticateAdmin, deleteDoctor);

// Payments & Payouts
adminRouter.get("/payments", authenticateAdmin, getPayments);
adminRouter.post("/payouts", authenticateAdmin, createPayout);

// Diseases CRUD
adminRouter.get("/diseases", authenticateAdmin, getDiseases);
adminRouter.get("/public/diseases", getDiseases);
adminRouter.post("/diseases", authenticateAdmin, createDisease);
adminRouter.put("/diseases/:id", authenticateAdmin, updateDisease);
adminRouter.delete("/diseases/:id", authenticateAdmin, deleteDisease);

// Feedback Management
adminRouter.get("/feedback", authenticateAdmin, getFeedback);
adminRouter.delete("/feedback/:id", authenticateAdmin, deleteFeedback);

// Reports & Analytics
adminRouter.get("/reports", authenticateAdmin, getReports);

// Settings Profile
adminRouter.put("/profile", authenticateAdmin, updateAdminProfile);

export default adminRouter;

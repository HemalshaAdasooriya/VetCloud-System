import express from "express";
// import { facebookLogin, googleLogin, loginUser, registerUser,  } from "../controllers/userController.js";

//Navindu 2026/05/27 ... Forgot Password Functionality
import {
    facebookLogin,
    googleLogin,
    loginUser,
    registerUser,
    sendForgotPasswordOTP,
    verifyForgotPasswordOTP,
    resetPassword,
    updateProfilePhoto,
    removeProfilePhoto,
    getUserProfile,
    updateUserProfile,
    changePassword,
    generate2FA,
    verifyAndEnable2FA,
    verifyLogin2FA,
    disable2FA,
    getActiveSessions,
    revokeSession,
    revokeOtherSessions,
    savePayoutSettings,
    saveConsultationFees,
    getAllVets,
    saveClinicDetails,
    submitFeedback,
    submitComplaint,
    getVetFeedback,
    getHomepageFeedback
} from "../controllers/userController.js";

//... Navindu

import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";
import { sendEmail, getMedicalReportTemplate } from "../config/email.js";




//Hemalsha 2026/05/30 ... Profile Picture Upload Functionality

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // unique filename
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const userRouter = express.Router();

userRouter.post("/", upload.single('profileImage'), registerUser);
userRouter.post("/google-login", googleLogin);
userRouter.post("/facebook-login", facebookLogin);
userRouter.post("/login", loginUser);

//Navindu 2026/05/27 ... Forgot Password Functionality
userRouter.post("/forgot-password", sendForgotPasswordOTP);
userRouter.post("/verify-otp", verifyForgotPasswordOTP);
userRouter.post("/reset-password", resetPassword);
//... Navindu

userRouter.post("/upload-photo", upload.single('profileImage'), updateProfilePhoto);
userRouter.delete("/remove-photo", removeProfilePhoto);
userRouter.put("/profile", updateUserProfile);
userRouter.get("/profile", getUserProfile);
userRouter.put("/change-password", changePassword);
userRouter.get("/generate-2fa", generate2FA);
userRouter.post("/verify-2fa", verifyAndEnable2FA);
userRouter.post("/verify-login-2fa", verifyLogin2FA);
userRouter.put("/disable-2fa", disable2FA);

userRouter.get("/sessions", getActiveSessions);
userRouter.delete("/sessions/others", revokeOtherSessions);
userRouter.delete("/sessions/:id", revokeSession);

// userRouter.put("/clinic", saveClinicDetails);
userRouter.put("/clinic", saveClinicDetails);
userRouter.put("/payout-settings", savePayoutSettings);
userRouter.put("/consultation-fees", saveConsultationFees);
userRouter.post("/feedback", submitFeedback);
userRouter.post("/complaints", submitComplaint);


//Navindu 2026/06/10 ... Get All Vets Functionality
userRouter.get("/vets", getAllVets);
userRouter.post("/feedback", submitFeedback);
userRouter.get("/feedback/homepage", getHomepageFeedback);
userRouter.get("/feedback/vet/:id", getVetFeedback);
//... Navindu

//... Hemalsha

// Chat Room File Upload Endpoint
userRouter.post("/chat-upload", upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
        url: fileUrl,
        name: req.file.originalname,
        size: req.file.size
    });
});

// Chat Room Email Prescription Endpoint
userRouter.post("/chat-email-prescription", (req, res) => {
    const { appointmentId, prescription } = req.body;
    if (!appointmentId || !prescription) {
        return res.status(400).json({ message: "Appointment ID and prescription text are required" });
    }

    const aptSql = `
        SELECT 
            a.id, 
            a.animal_id, 
            an.name AS animal_name, 
            an.species AS animal_species,
            an.breed AS animal_breed,
            v.fullName AS vet_name, 
            po.email AS owner_email, 
            po.fullName AS owner_name
        FROM appointments a
        JOIN veterinarians v ON a.veterinarian_id = v.id
        JOIN animals an ON a.animal_id = an.id
        JOIN pet_owners po ON a.pet_owner_id = po.id
        WHERE a.id = ?
    `;

    db.query(aptSql, [appointmentId], async (err, results) => {
        if (err || !results || results.length === 0) {
            console.error("Error fetching appointment for email:", err);
            return res.status(404).json({ message: "Appointment not found or clinical details missing" });
        }

        const apt = results[0];
        const dateStr = new Date().toLocaleDateString("en-US", {
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        });

        try {
            const html = getMedicalReportTemplate(
                apt.owner_name,
                apt.animal_name,
                `Prescription for Consultation #${apt.id}`,
                "Digital Prescription Report",
                prescription,
                `Dr. ${apt.vet_name}`,
                dateStr
            );

            await sendEmail({
                to: apt.owner_email,
                subject: `Prescription Report: ${apt.animal_name} - Consultation #${apt.id}`,
                html,
                text: `Dear ${apt.owner_name}, your prescription report for ${apt.animal_name} is available. Notes: ${prescription}`
            });

            res.json({ message: "Prescription emailed successfully to " + apt.owner_email });
        } catch (emailErr) {
            console.error("Failed to send prescription email:", emailErr);
            res.status(500).json({ message: "Failed to send prescription email" });
        }
    });
});

export default userRouter;

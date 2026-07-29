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
    submitComplaint
} from "../controllers/userController.js";

//... Navindu

import multer from "multer";
import path from "path";
import fs from "fs";




const userRouter = express.Router();

userRouter.post("/", registerUser);
userRouter.post("/google-login", googleLogin);
userRouter.post("/facebook-login", facebookLogin);
userRouter.post("/login", loginUser);

//Navindu 2026/05/27 ... Forgot Password Functionality
userRouter.post("/forgot-password", sendForgotPasswordOTP);
userRouter.post("/verify-otp", verifyForgotPasswordOTP);
userRouter.post("/reset-password", resetPassword);
//... Navindu

//Hemalsha 2026/05/30 ... Profile Picture Upload Functionality

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Make sure this folder exists in your backend root!
    },
    filename: (req, file, cb) => {
        // unique filename
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

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
userRouter.get("/feedback/vet/:id", getVetFeedback);
//... Navindu

//... Hemalsha

export default userRouter;

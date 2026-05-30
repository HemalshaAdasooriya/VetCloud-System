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
    updateUserProfile
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




//... Hemalsha

export default userRouter;

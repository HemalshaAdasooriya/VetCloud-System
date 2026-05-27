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
    resetPassword
} from "../controllers/userController.js";

//... Navindu


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

export default userRouter;

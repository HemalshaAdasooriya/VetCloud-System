import express from "express";
import { facebookLogin, googleLogin, registerUser,  } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/", registerUser);
userRouter.post("/google-login", googleLogin);
userRouter.post("/facebook-login", facebookLogin);
// userRouter.post("/login", loginUser);

export default userRouter;

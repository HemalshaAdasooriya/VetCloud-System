import express from "express";
import userRouter from "./routes/userRouter.js";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRouter);

app.listen(5000, () => {
    console.log("Server running");
});
import express from "express";
import { getNearbyClinics, searchPlaces } from "../controllers/mapController.js";

const mapRouter = express.Router();

mapRouter.get("/places", getNearbyClinics);
mapRouter.get("/search", searchPlaces);

export default mapRouter;
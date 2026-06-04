import express from "express";
import {
    getAnimals,
    getAnimalHistory,
    createNewAnimal,
    updateAnimalProfile,
    deleteAnimalProfile,
    addAnimalHistory,
    updateAnimalHistory,
    deleteAnimalHistory
} from "../controllers/animalController.js";

const animalRouter = express.Router();

animalRouter.get("/", getAnimals);
animalRouter.get("/:id/history", getAnimalHistory);
animalRouter.post("/:id/history", addAnimalHistory);
animalRouter.put("/history/:historyId", updateAnimalHistory);
animalRouter.delete("/history/:historyId", deleteAnimalHistory);
animalRouter.post("/", createNewAnimal);
animalRouter.put("/:id", updateAnimalProfile);
animalRouter.delete("/:id", deleteAnimalProfile);

export default animalRouter;

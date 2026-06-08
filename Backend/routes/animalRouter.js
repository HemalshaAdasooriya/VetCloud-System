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
import multer from "multer";
import path from "path";
import fs from "fs";

const animalRouter = express.Router();

//profile pic
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'animal-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
//---

animalRouter.get("/", getAnimals);
animalRouter.get("/:id/history", getAnimalHistory);
animalRouter.post("/:id/history", addAnimalHistory);
animalRouter.put("/history/:historyId", updateAnimalHistory);
animalRouter.delete("/history/:historyId", deleteAnimalHistory);
animalRouter.post("/", upload.single('image'), createNewAnimal);
animalRouter.put("/:id", upload.single('image'), updateAnimalProfile);
animalRouter.delete("/:id", deleteAnimalProfile);

export default animalRouter;

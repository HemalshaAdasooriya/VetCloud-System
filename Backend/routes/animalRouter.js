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

// profile pic & health report upload dir
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'animal-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
//---

const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'healthReport', maxCount: 1 }
]);

animalRouter.get("/", getAnimals);
animalRouter.get("/:id/history", getAnimalHistory);
animalRouter.post("/:id/history", addAnimalHistory);
animalRouter.put("/history/:historyId", updateAnimalHistory);
animalRouter.delete("/history/:historyId", deleteAnimalHistory);
animalRouter.post("/", uploadFields, createNewAnimal);
animalRouter.put("/:id", uploadFields, updateAnimalProfile);
animalRouter.delete("/:id", deleteAnimalProfile);

export default animalRouter;

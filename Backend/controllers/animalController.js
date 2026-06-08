// controllers/animalController.js
import {
    getAnimalsByOwner,
    getAnimalById,
    createAnimal,
    updateAnimal,
    deleteAnimal,
    getMedicalHistoryByAnimal,
    seedDefaultHistory,
    addMedicalHistoryRecord,
    updateMedicalHistoryRecord,
    deleteMedicalHistoryRecord
    
} from "../models/Animal.js";

// Get all animals for an owner
export const getAnimals = (req, res) => {
    const ownerId = req.query.ownerId;

    if (!ownerId) {
        return res.status(400).json({ message: "ownerId query parameter is required." });
    }

    getAnimalsByOwner(ownerId, (err, results) => {
        if (err) {
            console.error("Error fetching animals:", err);
            return res.status(500).json({ message: "Failed to fetch animals.", error: err });
        }
        return res.status(200).json(results);
    });
};

// Get medical history for a specific animal
export const getAnimalHistory = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Animal ID is required." });
    }

    getMedicalHistoryByAnimal(id, (err, results) => {
        if (err) {
            console.error("Error fetching medical histories:", err);
            return res.status(500).json({ message: "Failed to fetch medical history.", error: err });
        }
        return res.status(200).json(results);
    });
};

// Create a new animal profile
export const createNewAnimal = (req, res) => {
    const { owner_id, name, species, breed, age, weight, status, image } = req.body;

    if (!owner_id || !name || !species || !breed || !age || !weight) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    const lastVisit = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    // animal profile image
     let imagePath = image || null;
    if (req.file) {
        imagePath = `/uploads/${req.file.filename}`;
    }
    //-----

    const animalData = {
        owner_id,
        name,
        species,
        breed,
        age,
        weight,
        status: status || "Healthy",
        image: imagePath,
        lastVisit
    };

    createAnimal(animalData, (err, result) => {
        if (err) {
            console.error("Error creating animal profile:", err);
            return res.status(500).json({ message: "Failed to register animal profile.", error: err });
        }

        const newAnimalId = result.insertId;

        // Seed default medical records for the newly registered animal based on its species
        seedDefaultHistory(newAnimalId, species, (seedErr) => {
            if (seedErr) {
                console.error("Error seeding default history for new animal:", seedErr);
            }
            return res.status(201).json({
                message: "Animal registered successfully.",
                animal: { id: newAnimalId, ...animalData }
            });
        });
    });
};

// Update an existing animal profile
export const updateAnimalProfile = (req, res) => {
    const { id } = req.params;
    const { name, species, breed, age, weight, status, image } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Animal ID parameter is required." });
    }

    if (!name || !species || !breed || !age || !weight || !status) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    // Retain previous last visit date or set current one
    getAnimalById(id, (err, existing) => {
        if (err) {
            console.error("Error retrieving existing animal:", err);
            return res.status(500).json({ message: "Database lookup failed.", error: err });
        }

        if (!existing) {
            return res.status(404).json({ message: "Animal profile not found." });
        }


        //profile pic
        let imagePath = image || existing.image;
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }
        //---
        const animalData = {
            name,
            species,
            breed,
            age,
            weight,
            status,
            image: imagePath,
            lastVisit: existing.lastVisit || new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            })
        };

        updateAnimal(id, animalData, (updateErr, result) => {
            if (updateErr) {
                console.error("Error updating animal:", updateErr);
                return res.status(500).json({ message: "Failed to update animal profile.", error: updateErr });
            }
            return res.status(200).json({
                message: "Animal profile updated successfully.",
                animal: { id, ...animalData }
            });
        });
    });
};

// Delete (unregister) an animal profile
export const deleteAnimalProfile = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Animal ID parameter is required." });
    }

    deleteAnimal(id, (err, result) => {
        if (err) {
            console.error("Error deleting animal profile:", err);
            return res.status(500).json({ message: "Failed to unregister animal profile.", error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Animal profile not found or already deleted." });
        }

        return res.status(200).json({ message: "Animal profile removed successfully." });
    });
};

// Add a new medical history record
export const addAnimalHistory = (req, res) => {
    const { id } = req.params; // animal_id
    const { date, type, title, vet, notes } = req.body;

    if (!id || !date || !type || !title || !vet) {
        return res.status(400).json({ message: "Missing required fields for medical history." });
    }

    const historyData = {
        animal_id: id,
        date,
        type,
        title,
        vet,
        notes: notes || ""
    };

    addMedicalHistoryRecord(historyData, (err, result) => {
        if (err) {
            console.error("Error adding medical history record:", err);
            return res.status(500).json({ message: "Failed to add medical history record.", error: err });
        }
        return res.status(201).json({
            message: "Medical record added successfully.",
            record: { id: result.insertId, ...historyData }
        });
    });
};

// Update an existing medical history record
export const updateAnimalHistory = (req, res) => {
    const { historyId } = req.params;
    const { date, type, title, vet, notes } = req.body;

    if (!historyId || !date || !type || !title || !vet) {
        return res.status(400).json({ message: "Missing required fields for updating medical history." });
    }

    const historyData = {
        date,
        type,
        title,
        vet,
        notes: notes || ""
    };

    updateMedicalHistoryRecord(historyId, historyData, (err, result) => {
        if (err) {
            console.error("Error updating medical history record:", err);
            return res.status(500).json({ message: "Failed to update medical history record.", error: err });
        }
        return res.status(200).json({
            message: "Medical record updated successfully.",
            record: { id: historyId, ...historyData }
        });
    });
};

// Delete a medical history record
export const deleteAnimalHistory = (req, res) => {
    const { historyId } = req.params;

    if (!historyId) {
        return res.status(400).json({ message: "History ID is required." });
    }

    deleteMedicalHistoryRecord(historyId, (err, result) => {
        if (err) {
            console.error("Error deleting medical history record:", err);
            return res.status(500).json({ message: "Failed to delete medical history record.", error: err });
        }
        return res.status(200).json({ message: "Medical record deleted successfully." });
    });
};


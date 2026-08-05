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

import { triggerHistoryNotification } from "./notificationController.js";//isuri- user notification
import { uploadToSupabase } from "../config/supabaseClient.js";

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

const SPECIES_WEIGHT_LIMITS = {
    Cattle: 3000,
    Dog: 200,
    Cat: 30,
    Poultry: 10
};

// Create a new animal profile
export const createNewAnimal = async (req, res) => {
    const { owner_id, name, species, breed, age, weight, status, image, health_report } = req.body;

    if (!owner_id || !name || !species || !breed || !age || weight === undefined || weight === null || weight === "") {
        return res.status(400).json({ message: "Missing required fields." });
    }

    const weightFloat = parseFloat(weight);
    const maxWeightLimit = SPECIES_WEIGHT_LIMITS[species] || null;
    if (isNaN(weightFloat) || weightFloat <= 0 || (maxWeightLimit !== null && weightFloat > maxWeightLimit)) {
        if (maxWeightLimit !== null) {
            return res.status(400).json({ message: `Maximum weight allowed for ${species} is ${maxWeightLimit} kg (must be greater than 0).` });
        }
        return res.status(400).json({ message: "Animal weight must be a valid number greater than 0." });
    }

    const lastVisit = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    let animalImage = image || null;
    const imageFile = (req.files && req.files['image'] && req.files['image'][0]) || req.file;
    if (imageFile) {
        try {
            const uploadedUrl = await uploadToSupabase(imageFile, "animal");
            if (uploadedUrl) animalImage = uploadedUrl;
        } catch (err) {
            console.error("Failed to upload animal image to Supabase:", err);
        }
    }

    let healthReportPath = health_report || null;
    const healthReportFile = req.files && req.files['healthReport'] && req.files['healthReport'][0];
    if (healthReportFile) {
        try {
            const uploadedReportUrl = await uploadToSupabase(healthReportFile, "report");
            if (uploadedReportUrl) healthReportPath = uploadedReportUrl;
        } catch (err) {
            console.error("Failed to upload health report to Supabase:", err);
        }
    }

    const animalData = {
        owner_id,
        name,
        species,
        breed,
        age,
        weight: weightFloat,
        status: status || "Healthy",
        image: animalImage,
        lastVisit,
        health_report: healthReportPath
    };

    createAnimal(animalData, (err, result) => {
        if (err) {
            console.error("Error creating animal profile:", err);
            return res.status(500).json({ message: "Failed to register animal profile.", error: err });
        }

        const newAnimalId = result.insertId;

        return res.status(201).json({
            message: "Animal registered successfully.",
            animal: { id: newAnimalId, ...animalData }
        });
    });
};

// Update an existing animal profile
export const updateAnimalProfile = (req, res) => {
    const { id } = req.params;
    const { name, species, breed, age, weight, status, image, health_report } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Animal ID parameter is required." });
    }

    if (!name || !species || !breed || !age || weight === undefined || weight === null || weight === "" || !status) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    const weightFloat = parseFloat(weight);
    const maxWeightLimit = SPECIES_WEIGHT_LIMITS[species] || null;
    if (isNaN(weightFloat) || weightFloat <= 0 || (maxWeightLimit !== null && weightFloat > maxWeightLimit)) {
        if (maxWeightLimit !== null) {
            return res.status(400).json({ message: `Maximum weight allowed for ${species} is ${maxWeightLimit} kg (must be greater than 0).` });
        }
        return res.status(400).json({ message: "Animal weight must be a valid number greater than 0." });
    }

    // Retain previous last visit date or set current one
    getAnimalById(id, async (err, existing) => {
        if (err) {
            console.error("Error retrieving existing animal:", err);
            return res.status(500).json({ message: "Database lookup failed.", error: err });
        }

        if (!existing) {
            return res.status(404).json({ message: "Animal profile not found." });
        }

        let animalImage = image || existing.image;
        const imageFile = (req.files && req.files['image'] && req.files['image'][0]) || req.file;
        if (imageFile) {
            try {
                const uploadedUrl = await uploadToSupabase(imageFile, "animal");
                if (uploadedUrl) animalImage = uploadedUrl;
            } catch (uErr) {
                console.error("Failed to upload updated animal image to Supabase:", uErr);
            }
        }

        let healthReportPath = health_report || existing.health_report || null;
        const healthReportFile = req.files && req.files['healthReport'] && req.files['healthReport'][0];
        if (healthReportFile) {
            try {
                const uploadedReportUrl = await uploadToSupabase(healthReportFile, "report");
                if (uploadedReportUrl) healthReportPath = uploadedReportUrl;
            } catch (uErr) {
                console.error("Failed to upload updated health report to Supabase:", uErr);
            }
        }

        const animalData = {
            name,
            species,
            breed,
            age,
            weight: weightFloat,
            status,
            image: animalImage,
            lastVisit: existing.lastVisit || new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }),
            health_report: healthReportPath
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
        triggerHistoryNotification(req.app, result.insertId, "created");// isuri-notification

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
         triggerHistoryNotification(req.app, historyId, "updated");//isuri-notification

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


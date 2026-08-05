// models/Animal.js
import db from "../config/db.js";

// Ensure health_report column exists in animals table
db.query("SHOW COLUMNS FROM animals LIKE 'health_report'", (err, results) => {
    if (!err && results && results.length === 0) {
        db.query("ALTER TABLE animals ADD COLUMN health_report TEXT NULL", (alterErr) => {
            if (alterErr) console.error("Error adding health_report column:", alterErr.message);
            else console.log("Added health_report column to animals table.");
        });
    }
});

// Fetch all animals for a specific pet owner
export const getAnimalsByOwner = (ownerId, callback) => {
    const sql = "SELECT * FROM animals WHERE owner_id = ? ORDER BY id DESC";
    db.query(sql, [ownerId], callback);
};

// Fetch a single animal by ID
export const getAnimalById = (id, callback) => {
    const sql = "SELECT * FROM animals WHERE id = ?";
    db.query(sql, [id], (err, results) => {
        if (err) return callback(err, null);
        callback(null, results[0] || null);
    });
};

// Create a new animal
export const createAnimal = (animalData, callback) => {
    const sql = `
        INSERT INTO animals (owner_id, name, species, breed, age, weight, status, image, lastVisit, health_report)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
        sql,
        [
            animalData.owner_id,
            animalData.name,
            animalData.species,
            animalData.breed,
            animalData.age,
            animalData.weight,
            animalData.status || "Healthy",
            animalData.image || null,
            animalData.lastVisit || null,
            animalData.health_report || null
        ],
        callback
    );
};

// Update an existing animal
export const updateAnimal = (id, animalData, callback) => {
    const sql = `
        UPDATE animals
        SET name = ?, species = ?, breed = ?, age = ?, weight = ?, status = ?, image = ?, lastVisit = ?, health_report = ?
        WHERE id = ?
    `;
    db.query(
        sql,
        [
            animalData.name,
            animalData.species,
            animalData.breed,
            animalData.age,
            animalData.weight,
            animalData.status,
            animalData.image,
            animalData.lastVisit,
            animalData.health_report || null,
            id
        ],
        callback
    );
};

// Delete an animal profile
export const deleteAnimal = (id, callback) => {
    const deleteAppointmentsSql = "DELETE FROM appointments WHERE animal_id = ?";
    db.query(deleteAppointmentsSql, [id], (err, result) => {
        if (err) return callback(err, null);
        
        const sql = "DELETE FROM animals WHERE id = ?";
        db.query(sql, [id], callback);
    });
};

// Fetch medical histories for an animal
export const getMedicalHistoryByAnimal = (animalId, callback) => {
    const sql = "SELECT * FROM animal_medical_histories WHERE animal_id = ? ORDER BY id DESC";
    db.query(sql, [animalId], callback);
};

// Seed default history helper for standard species
export const seedDefaultHistory = (animalId, species, callback) => {
    // Generate nice realistic default history based on species
    let records = [];
    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    
    if (species === "Cattle") {
        records = [
            { date: today, type: "Vaccination", title: "Foot-and-Mouth Disease (FMD) Vaccine", vet: "Dr. Emily Smith", notes: "Routine vaccine booster. Clean health bill." },
            { date: "12 May, 2025", type: "Checkup", title: "Weight and Nutrition Assessment", vet: "Dr. Emily Smith", notes: "Weight healthy. Recommended continuing standard silage feed." }
        ];
    } else if (species === "Dog") {
        records = [
            { date: today, type: "Diagnostic", title: "Blood Check & Parasite Panel", vet: "Dr. Sarah Connor", notes: "Undergoing standard heartworm prevention treatment." },
            { date: "15 Jan, 2025", type: "Vaccination", title: "Rabies Booster", vet: "Dr. Sarah Connor", notes: "Annual rabies vaccination completed." }
        ];
    } else if (species === "Poultry") {
        records = [
            { date: today, type: "Inspection", title: "Flock Health Assessment", vet: "Dr. Arthur Vance", notes: "Evaluated layers. Excellent egg laying quality. Feed ratios stable." }
        ];
    } else if (species === "Cat") {
        records = [
            { date: today, type: "Checkup", title: "Annual Dental Inspection", vet: "Dr. Lisa Cuddy", notes: "Teeth cleaned, gums look robust. Cat is active and healthy." }
        ];
    } else {
        records = [
            { date: today, type: "Checkup", title: "General Health Screening", vet: "Dr. Emily Smith", notes: "Routine checkup completed. Animal is in excellent physical condition." }
        ];
    }

    if (records.length === 0) {
        return callback(null, []);
    }

    // Insert records sequentially or concurrently
    const sql = `
        INSERT INTO animal_medical_histories (animal_id, date, type, title, vet, notes)
        VALUES ?
    `;
    const values = records.map(r => [animalId, r.date, r.type, r.title, r.vet, r.notes]);
    db.query(sql, [values], callback);
};

// Add a single medical history record
export const addMedicalHistoryRecord = (historyData, callback) => {
    const sql = `
        INSERT INTO animal_medical_histories (animal_id, date, type, title, vet, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(
        sql,
        [
            historyData.animal_id,
            historyData.date,
            historyData.type,
            historyData.title,
            historyData.vet,
            historyData.notes
        ],
        callback
    );
};

// Update an existing medical history record
export const updateMedicalHistoryRecord = (id, historyData, callback) => {
    const sql = `
        UPDATE animal_medical_histories
        SET date = ?, type = ?, title = ?, vet = ?, notes = ?
        WHERE id = ?
    `;
    db.query(
        sql,
        [
            historyData.date,
            historyData.type,
            historyData.title,
            historyData.vet,
            historyData.notes,
            id
        ],
        callback
    );
};

// Delete a medical history record
export const deleteMedicalHistoryRecord = (id, callback) => {
    const sql = "DELETE FROM animal_medical_histories WHERE id = ?";
    db.query(sql, [id], callback);
};



// models/userModel.js
import db from "../config/db.js";

// 1. Insert into Pet Owners Table
export const createPetOwner = (userData, callback) => {
    const sql = `
        INSERT INTO pet_owners
        (
            email, 
            password, 
            fullName, 
            contact_No, 
            address, 
            numberOfAnimals,
            image,
            provider
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            userData.email,
            userData.password,
            userData.fullName,
            userData.contact_No,
            userData.address || "",
            userData.numberOfAnimals || 0,
            userData.image || "/default.jpg",
            userData.provider || "local"
        ],
        callback
    );
};

// 2. Insert into Veterinarians Table
export const createVeterinarian = (userData, callback) => {
    const sql = `
        INSERT INTO veterinarians
        (
            email, 
            password, 
            fullName, 
            contact_No, 
            license_number, 
            specialization, 
            years_of_experience, 
            consultation_fee,
            image,
            provider
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            userData.email,
            userData.password,
            userData.fullName,
            userData.contact_No,
            userData.license_number,
            userData.specialization,
            userData.years_of_experience || 0,
            userData.consultation_fee || 0.00,
            userData.image || "/default.jpg",
            userData.provider || "local"
        ],
        callback
    );
};

// 3. Check if email exists in EITHER table
export const checkEmailExists = (email, callback) => {
    const sql = `
        SELECT email FROM pet_owners WHERE email = ?
        UNION
        SELECT email FROM veterinarians WHERE email = ?
    `;

    db.query(sql, [email, email], callback);
};

// 4. Fetch User for Login Verification
export const getUserByEmailAndRole = (email, role, callback) => {
    let tableName = "";

    // Map frontend roles to database tables
    if (role === "farmer") {
        tableName = "pet_owners";
    } else if (role === "doctor") {
        tableName = "veterinarians";
    } else if (role === "admin") {
        tableName = "admins"; // You will need to create this table in MySQL!
    } else {
        return callback({ message: "Invalid role selected" }, null);
    }

    const sql = `SELECT * FROM ${tableName} WHERE email = ?`;
    
    db.query(sql, [email], callback);
};
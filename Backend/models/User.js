// models/userModel.js
import db from "../config/db.js";

// 1. Insert into Pet Owners Table
// export const createPetOwner = (userData, callback) => {
//     const sql = `
//         INSERT INTO pet_owners
//         (
//             email, 
//             password, 
//             fullName, 
//             contact_No, 
//             address, 
//             numberOfAnimals,
//             image,
//             provider
//         )
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     db.query(
//         sql,
//         [
//             userData.email,
//             userData.password,
//             userData.fullName,
//             userData.contact_No,
//             userData.address || "",
//             userData.numberOfAnimals || 0,
//             userData.image || "/default.jpg",
//             userData.provider || "local"
//         ],
//         callback
//     );
// };
// 1. Insert into Pet Owners Table AND Profiles Table
export const createPetOwner = (userData, callback) => {
    // Factory Assembly 1: Stitch the first and last name together
    const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();

    // Factory Assembly 2: Stitch the address parts together safely
    const fullAddress = [
        userData.street, userData.city, userData.state, userData.zip, userData.country
    ].filter(part => part && part.trim() !== "").join(", ");

    // Database Action 1: Save the core data to the main table
    const insertMainSql = `
        INSERT INTO pet_owners
        (email, password, fullName, contact_No, address, numberOfAnimals, image, provider)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const mainValues = [
        userData.email,
        userData.password,
        fullName,
        userData.contact_No,
        fullAddress,
        userData.numberOfAnimals || 0,
        userData.image || "/default.jpg",
        userData.provider || "local"
    ];

    db.query(insertMainSql, mainValues, (err, result) => {
        if (err) return callback(err, null);

        // Capture the new auto-generated ID to link the profile
        const newOwnerId = result.insertId;

        // Database Action 2: Save the detailed parts to the new profile table
        const insertProfileSql = `
            INSERT INTO pet_owner_profiles 
            (owner_id, firstName, lastName, street, city, state, zip, country)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const profileValues = [
            newOwnerId, 
            userData.firstName || "", 
            userData.lastName || "", 
            userData.street || "", 
            userData.city || "", 
            userData.state || "", 
            userData.zip || "", 
            userData.country || ""
        ];

        db.query(insertProfileSql, profileValues, (profileErr, profileResult) => {
            if (profileErr) return callback(profileErr, null);
            
            // Send the final success signal back to the controller
            callback(null, result);
        });
    });
};

// 2. Insert into Veterinarians Table
// export const createVeterinarian = (userData, callback) => {
//     const sql = `
//         INSERT INTO veterinarians
//         (
//             email, 
//             password, 
//             fullName, 
//             contact_No, 
//             license_number, 
//             specialization, 
//             years_of_experience, 
//             consultation_fee,
//             image,
//             provider
//         )
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     db.query(
//         sql,
//         [
//             userData.email,
//             userData.password,
//             userData.fullName,
//             userData.contact_No,
//             userData.license_number,
//             userData.specialization,
//             userData.years_of_experience || 0,
//             userData.consultation_fee || 0.00,
//             userData.image || "/default.jpg",
//             userData.provider || "local"
//         ],
//         callback
//     );
// };

export const createVeterinarian = (userData, callback) => {
    // Stitch the name together for the main table
    const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();

    // Step 1: Insert core data into the main veterinarians table
    const insertMainSql = `
        INSERT INTO veterinarians
        (email, password, fullName, contact_No, license_number, specialization, years_of_experience, consultation_fee, image, provider)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const mainValues = [
        userData.email,
        userData.password,
        fullName,
        userData.contact_No,
        userData.license_number,
        userData.specialization,
        userData.years_of_experience || 0,
        userData.consultation_fee || 0.00,
        userData.image || "/default.jpg",
        userData.provider || "local"
    ];

    db.query(insertMainSql, mainValues, (err, result) => {
        if (err) return callback(err, null);

        const newVetId = result.insertId;

        // Step 2: Insert the separated names into the profile table
        const insertProfileSql = `
            INSERT INTO veterinarian_profiles 
            (vet_id, firstName, lastName, clinicName, bio)
            VALUES (?, ?, ?, ?, ?)
        `;

        const profileValues = [
            newVetId, 
            userData.firstName || "", 
            userData.lastName || "", 
            "", // Empty clinic name by default
            ""  // Empty bio by default
        ];

        db.query(insertProfileSql, profileValues, (profileErr, profileResult) => {
            if (profileErr) return callback(profileErr, null);
            callback(null, result);
        });
    });
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


//Navindu 2026/05/27 ... Forgot Password Functionality
// Save OTP
export const savePasswordResetOTP = (email, otp, expiresAt, callback) => {
    const sql = `
        INSERT INTO password_resets (email, otp, expires_at)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [email, otp, expiresAt], callback);
};

// Verify OTP
export const verifyOTP = (email, otp, callback) => {
    const sql = `
        SELECT * FROM password_resets
        WHERE email = ?
        AND otp = ?
        AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
    `;

    db.query(sql, [email, otp], callback);
};

// Update password in pet owners
export const updatePetOwnerPassword = (email, password, callback) => {
    const sql = `
        UPDATE pet_owners
        SET password = ?
        WHERE email = ?
    `;

    db.query(sql, [password, email], callback);
};

// Update password in veterinarians
export const updateVeterinarianPassword = (email, password, callback) => {
    const sql = `
        UPDATE veterinarians
        SET password = ?
        WHERE email = ?
    `;

    db.query(sql, [password, email], callback);
};

//...Navindu


//Hemalsha 2026/05/30 ... Profile Picture Upload Functionality
export const updateUserImage = (id, role, imageUrl, callback) => {
    let tableName = "";
    
    // Check role to determine the correct table
    if (role === "Farmer/PetOwner" || role === "farmer") {
        tableName = "pet_owners";
    } else if (role === "Veterinary Doctor" || role === "doctor") {
        tableName = "veterinarians";
    } else {
        return callback({ message: "Invalid role for image update" }, null);
    }

    const sql = `UPDATE ${tableName} SET image = ? WHERE id = ?`;
    db.query(sql, [imageUrl, id], callback);
};

//Hemalsha

// Add this at the bottom of your models/User.js file

export const updatePetOwnerProfile = (ownerId, profileData, callback) => {
    // 1. Pre-process the Address
    // This takes all the pieces, removes any that are empty/undefined, and joins them with ", "
    const fullAddress = [
        profileData.street, 
        profileData.city, 
        profileData.state, 
        profileData.zip, 
        profileData.country
    ]
    .filter(part => part && part.trim() !== "") // Ignores empty fields
    .join(", ");

    // Query 1: Insert or Update the detailed profile table
    const profileSql = `
        INSERT INTO pet_owner_profiles 
        (owner_id, firstName, lastName, farmName, farmSize, bio, street, city, state, zip, country)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            firstName = VALUES(firstName),
            lastName = VALUES(lastName),
            farmName = VALUES(farmName),
            farmSize = VALUES(farmSize),
            bio = VALUES(bio),
            street = VALUES(street),
            city = VALUES(city),
            state = VALUES(state),
            zip = VALUES(zip),
            country = VALUES(country)
    `;

    const profileValues = [
        ownerId,
        profileData.firstName, profileData.lastName,
        profileData.farmName, profileData.farmSize, profileData.bio,
        profileData.street, profileData.city, profileData.state,
        profileData.zip, profileData.country
    ];

    // Query 2: Update the main table's fullName AND address
    const mainTableSql = `
        UPDATE pet_owners 
        SET 
            fullName = CONCAT(?, ' ', ?),
            address = ?,
            contact_No = ?
        WHERE id = ?
    `;

    const mainTableValues = [
        profileData.firstName, 
        profileData.lastName, 
        fullAddress, 
        profileData.phone, 
        ownerId
    ];

    // Execute Query 1
    db.query(profileSql, profileValues, (err1, result1) => {
        if (err1) return callback(err1, null);

        // If Query 1 succeeds, execute Query 2
        db.query(mainTableSql, mainTableValues, (err2, result2) => {
            if (err2) return callback(err2, null);
            
            callback(null, { message: "Profile, Full Name, and Address updated successfully" });
        });
    });
};

export const updateVeterinarianProfile = (vetId, profileData, callback) => {
    // Query 1: Insert or Update the detailed profile table (No address fields here)
    const profileSql = `
        INSERT INTO veterinarian_profiles 
        (vet_id, firstName, lastName, clinicName, bio)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            firstName = VALUES(firstName),
            lastName = VALUES(lastName),
            clinicName = VALUES(clinicName),
            bio = VALUES(bio)
    `;

    const profileValues = [
        vetId,
        profileData.firstName, 
        profileData.lastName,
        profileData.clinicName, 
        profileData.bio
    ];

    // Query 2: Update the main table's fullName and phone number
    const mainTableSql = `
        UPDATE veterinarians 
        SET 
            fullName = CONCAT(?, ' ', ?),
            contact_No = ?
        WHERE id = ?
    `;

    const mainTableValues = [
        profileData.firstName, 
        profileData.lastName,  
        profileData.phone, 
        vetId
    ];

    // Execute Query 1
    db.query(profileSql, profileValues, (err1, result1) => {
        if (err1) return callback(err1, null);

        // If Query 1 succeeds, execute Query 2
        db.query(mainTableSql, mainTableValues, (err2, result2) => {
            if (err2) return callback(err2, null);
            
            callback(null, { message: "Veterinarian Profile and Full Name updated successfully" });
        });
    });
};

// --- Fetch complete user profile by joining the two tables ---
export const getFullPetOwnerProfile = (ownerId, callback) => {
    const sql = `
        SELECT 
            main.email, main.contact_No, main.numberOfAnimals, main.image,
            profile.firstName, profile.lastName, profile.farmName, profile.farmSize, 
            profile.bio, profile.street, profile.city, profile.state, profile.zip, profile.country
        FROM pet_owners main
        LEFT JOIN pet_owner_profiles profile ON main.id = profile.owner_id
        WHERE main.id = ?
    `;

    db.query(sql, [ownerId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        
        // If the user doesn't exist at all
        if (results.length === 0) {
            return callback({ message: "User not found" }, null);
        }
        
        // Return the single combined user object
        callback(null, results[0]); 
    });
};
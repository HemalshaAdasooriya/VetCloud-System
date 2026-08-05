// models/userModel.js
import db from "../config/db.js";

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
        (email, password, fullName, contact_No, address, numberOfAnimals, image, provider, is_Active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
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

// 2. Insert into Veterinarians Table AND Profiles Table
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
        // FIX: Match exact columns in the veterinarian_profiles table (vet_id is the database column)
        const insertProfileSql = `
            INSERT INTO veterinarian_profiles 
            (vet_id, firstName, lastName, bio, professional_title)
            VALUES (?, ?, ?, ?, ?)
        `;

        const profileValues = [
            newVetId, 
            userData.firstName || "", 
            userData.lastName || "", 
            "", // Empty bio by default
            ""  // Empty professional title by default
        ];

        db.query(insertProfileSql, profileValues, (profileErr, profileResult) => {
            if (profileErr) {
                console.error("❌ veterinarian_profiles insert failed:", profileErr.sqlMessage || profileErr);
                // Rollback: delete the veterinarian row we just inserted
                db.query("DELETE FROM veterinarians WHERE id = ?", [newVetId], () => {});
                return callback(profileErr, null);
            }
            console.log("✅ veterinarian_profiles row created for vet_id:", newVetId);
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

    // Query 2: Update the main table's fullName, address, contact_No AND email
    const mainTableSql = `
        UPDATE pet_owners 
        SET 
            fullName = CONCAT(?, ' ', ?),
            address = ?,
            contact_No = ?,
            email = ?
        WHERE id = ?
    `;

    const mainTableValues = [
        profileData.firstName, 
        profileData.lastName, 
        fullAddress, 
        profileData.phone, 
        profileData.email || "",
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
    // USING CORRECT COLUMN NAME vet_id FOR veterinarian_profiles
    const profileSql = `
        INSERT INTO veterinarian_profiles 
        (vet_id, firstName, lastName, bio, professional_title)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            firstName = VALUES(firstName),
            lastName = VALUES(lastName),
            bio = VALUES(bio),
            professional_title = VALUES(professional_title)
    `;

    const profileValues = [
        vetId,
        profileData.firstName, 
        profileData.lastName, 
        profileData.bio,
        profileData.professional_title
    ];

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

    db.query(profileSql, profileValues, (err, result) => {
        if (err) return callback(err, null);

        db.query(mainTableSql, mainTableValues, (err2, result2) => {
            if (err2) return callback(err2, null);
            
            callback(null, { message: "Profile, Full Name, and Address updated successfully" });
        });
    });
};

// --- Fetch complete user profile by joining the two tables ---
export const getFullPetOwnerProfile = (ownerId, callback) => {
    const sql = `
        SELECT 
            main.email, main.contact_No, main.numberOfAnimals, main.image, main.is_two_factor_enabled,
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


//change password
// Get user's current hashed password by ID
export const getUserPasswordById = (id, role, callback) => {
    let tableName = (role === "Farmer/PetOwner" || role === "farmer") ? "pet_owners" : "veterinarians";
    const sql = `SELECT password FROM ${tableName} WHERE id = ?`;
    
    db.query(sql, [id], (err, results) => {
        if (err) return callback(err, null);
        if (results.length === 0) return callback({ message: "User not found" }, null);
        callback(null, results[0].password); // Return only the password string
    });
};

// Update user's password by ID
export const updateUserPasswordById = (id, role, newPasswordHash, callback) => {
    let tableName = (role === "Farmer/PetOwner" || role === "farmer") ? "pet_owners" : "veterinarians";
    const sql = `UPDATE ${tableName} SET password = ? WHERE id = ?`;
    
    db.query(sql, [newPasswordHash, id], callback);
};

// --- Save 2FA Secret to Database ---
export const enableUser2FA = (userId, role, secret, callback) => {
    let tableName = (role === "Farmer/PetOwner" || role === "farmer") ? "pet_owners" : "veterinarians";
    
    const sql = `UPDATE ${tableName} SET two_factor_secret = ?, is_two_factor_enabled = TRUE WHERE id = ?`;
    
    db.query(sql, [secret, userId], callback);
};

// --- Fetch a user by ID for 2FA Verification ---
export const getUserByIdAndRole = (id, role, callback) => {
    let tableName = (role === "Farmer/PetOwner" || role === "farmer") ? "pet_owners" : "veterinarians";
    const sql = `SELECT * FROM ${tableName} WHERE id = ?`;
    
    db.query(sql, [id], (err, results) => {
        if (err) return callback(err, null);
        if (results.length === 0) return callback({ message: "User not found" }, null);
        
        callback(null, results[0]); // Send the user data back to the controller
    });
};

// --- Disable 2FA by removing the secret and setting the flag to false ---
export const disableUser2FA = (userId, role, callback) => {
    let tableName = (role === "Farmer/PetOwner" || role === "farmer") ? "pet_owners" : "veterinarians";
    
    const sql = `UPDATE ${tableName} SET two_factor_secret = NULL, is_two_factor_enabled = FALSE WHERE id = ?`;
    
    db.query(sql, [userId], callback);
};

// --- Session Management Database Functions ---

export const saveUserSession = (userId, role, device, token, callback) => {
    const sql = `INSERT INTO user_sessions (user_id, user_role, device, token) VALUES (?, ?, ?, ?)`;
    db.query(sql, [userId, role, device, token], callback);
};

export const getUserSessions = (userId, role, callback) => {
    const sql = `SELECT id, device, location, login_time, token FROM user_sessions WHERE user_id = ? AND user_role = ? ORDER BY login_time DESC`;
    db.query(sql, [userId, role], callback);
};

export const deleteSessionById = (sessionId, callback) => {
    const sql = `DELETE FROM user_sessions WHERE id = ?`;
    db.query(sql, [sessionId], callback);
};

export const deleteOtherSessions = (userId, role, currentToken, callback) => {
    const sql = `DELETE FROM user_sessions WHERE user_id = ? AND user_role = ? AND token != ?`;
    db.query(sql, [userId, role, currentToken], callback);
};

// --- Fetch complete Veterinarian profile by joining the two tables ---
export const getFullVeterinarianProfile = (vetId, callback) => {
    
    const sql = `
        SELECT 
            main.id, main.email, main.contact_No, main.license_number, main.specialization, 
            main.years_of_experience, main.consultation_fee, main.image, main.is_two_factor_enabled,
            profile.firstName, profile.lastName, profile.bio, profile.professional_title,
            clinic.clinic_name, clinic.registration_number, clinic.address AS clinic_address, 
            clinic.city AS clinic_city, clinic.state AS clinic_state, 
            clinic.zip_code AS clinic_zip, clinic.phone AS clinic_phone,
            bank.bank_name, bank.account_name, bank.account_number, bank.branch_code, bank.payout_schedule, bank.minimum_payout
        FROM veterinarians main
        /* USING CORRECT JOIN COLUMN: profile.vet_id */
        LEFT JOIN veterinarian_profiles profile ON main.id = profile.vet_id
        LEFT JOIN clinics clinic ON main.id = clinic.veterinarian_id
        LEFT JOIN veterinarian_bank_details bank ON main.id = bank.vet_id
        WHERE main.id = ?
    `;

    db.query(sql, [vetId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        
        if (results.length === 0) {
            return callback({ message: "User not found" }, null);
        }
        
        const profileData = results[0];
        const consultFee = parseFloat(profileData.consultation_fee || 0);

        // Fetch balance details: completed appointments count, total payouts, commission pct
        const balanceSql = `
            SELECT 
                (SELECT COUNT(*) FROM appointments WHERE veterinarian_id = ? AND status = 'Completed') AS completedCount,
                (SELECT COALESCE(SUM(amount), 0) FROM payouts WHERE veterinarian_id = ? AND status = 'Paid') AS totalPaidPayouts,
                (SELECT CAST(setting_value AS UNSIGNED) FROM system_settings WHERE setting_key = 'commission_percentage') AS commissionPercentage
        `;

        db.query(balanceSql, [vetId, vetId], (balErr, balResults) => {
            if (balErr) {
                console.error("Error querying doctor balance details:", balErr);
                profileData.current_balance = 0;
                profileData.completed_appointments_count = 0;
                profileData.total_paid_payouts = 0;
                return callback(null, profileData);
            }

            const balData = balResults[0] || { completedCount: 0, totalPaidPayouts: 0, commissionPercentage: 10 };
            const completedCount = balData.completedCount || 0;
            const totalPaidPayouts = parseFloat(balData.totalPaidPayouts || 0);
            const commissionPercentage = parseFloat(balData.commissionPercentage || 10);

            // Compute total earnings and remaining balance
            const totalEarnings = completedCount * consultFee * (1 - (commissionPercentage / 100));
            const currentBalance = totalEarnings - totalPaidPayouts;

            profileData.current_balance = Math.max(0, currentBalance);
            profileData.completed_appointments_count = completedCount;
            profileData.total_paid_payouts = totalPaidPayouts;

            callback(null, profileData);
        });
    });
};


// Function to Insert OR Update the clinic details in the new dedicated table
export const updateClinicDetails = (userId, clinicData, callback) => {
    
    // The "Upsert" Query: Insert if new, Update if it already exists!
    const query = `
        INSERT INTO clinics 
        (veterinarian_id, clinic_name, registration_number, address, city, state, zip_code, phone) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            clinic_name = VALUES(clinic_name),
            registration_number = VALUES(registration_number),
            address = VALUES(address),
            city = VALUES(city),
            state = VALUES(state),
            zip_code = VALUES(zip_code),
            phone = VALUES(phone)
    `;

    // Map the React data to the query variables
    const values = [
        userId,                                 // veterinarian_id
        clinicData.clinicName,                  // From React
        clinicData.clinicRegistrationNumber,    // From React
        clinicData.address,                     // From React
        clinicData.city,                        // From React
        clinicData.state,                       // From React
        clinicData.zipCode,                     // From React
        clinicData.clinicPhone                  // From React
    ];

    db.query(query, values, (err, result) => {
        if (err) return callback(err, null);
        return callback(null, result);
    });
};


// ── Update Consultation Fees ──────────────────────────────────────────────────
export const updateConsultationFees = (vetId, feesData, callback) => {
    const sql = `
        UPDATE veterinarians 
        SET consultation_fee = ?
        WHERE id = ?
    `;
    db.query(sql, [feesData.consultation_fee || 0, vetId], (err, result) => {
        if (err) return callback(err, null);
        return callback(null, { message: "Consultation fees updated successfully" });
    });
};



const db = require("../config/db");

const createUser = (userData, callback) => {
    const sql = `INSERT INTO users
    (
        email,
        password,
        firstName,
        lastName,
        role,
        isEmailVerified,
        contact_No,
        address,
        is_Active,
        image
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.role || "Farmer/PetOwner",
        userData.isEmailVerified || 0,
        userData.contact_No || null,
        userData.address || null,
        userData.is_Active || 0,
        userData.image || "/default.jpg"
    ], callback);
};

const getAllUsers = (callback) => {
    const sql = "SELECT * FROM users";
    db.query(sql, callback);
};

const getUserByEmail = (email, callback) => {
    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], callback);
};

module.exports = {
    createUser,
    getAllUsers,
    getUserByEmail
};
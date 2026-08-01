// controllers/userController.js
import dotenv from "dotenv";
dotenv.config();
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { createPetOwner, createVeterinarian, checkEmailExists, getUserByEmailAndRole, getFullPetOwnerProfile } from "../models/User.js";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import jwt from "jsonwebtoken";
//Navindu 2026/05/27 ... Forgot Password FunctionalityupdateUserProfile
import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";
import { UAParser } from "ua-parser-js";
import { sendEmail, getAccountVerificationTemplate } from "../config/email.js";

import {
    savePasswordResetOTP,
    verifyOTP,
    updatePetOwnerPassword,
    updateVeterinarianPassword,
    updateUserImage,
    updatePetOwnerProfile,
    updateVeterinarianProfile,
    enableUser2FA,
    getUserByIdAndRole,
    disableUser2FA,
    saveUserSession,
    getUserSessions,
    deleteSessionById,
    deleteOtherSessions,
    getFullVeterinarianProfile,
    updateClinicDetails,
    updateConsultationFees,
    getUserPasswordById, 
    updateUserPasswordById
} from "../models/User.js";
//... Navindu
import fs from "fs";
import path from "path";
import db from "../config/db.js";
import { updatePayoutSettings } from "../models/Payment.js";



const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

export function registerUser(req, res) {
    const data = req.body;

    // 1. Basic validation
    if (!data.email || !data.password || !data.firstName || !data.lastName || !data.role) {
        return res.status(400).json({
            message: "Missing required fields."
        });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : "/default.jpg";

    // 2. Check if email already exists in either table
    checkEmailExists(data.email, (err, results) => {
        if (err) {
            return res.status(500).json(err);
        }

        if (results.length > 0) {
            return res.status(400).json({
                message: "Email already exists on this platform."
            });
        }

        // 3. Process the registration based on the role
        try {
            const hashedPassword = bcrypt.hashSync(data.password, 11);

            // ROUTE A: Pet Owner Registration
            if (data.role === "Farmer/PetOwner") {
                createPetOwner(
                    {
                        email: data.email,
                        password: hashedPassword,
                        firstName: data.firstName, 
                        lastName: data.lastName, 
                        contact_No: data.contact_No,
                        street: data.street,       
                        city: data.city,           
                        state: data.state,         
                        zip: data.zip,             
                        country: data.country,
                        numberOfAnimals: data.numberOfAnimals, // Matched to frontend payload exactly
                        image: imagePath,
                        provider: 'local'
                    },
                    (err, result) => {
                        if (err) return res.status(500).json(err);
                        //isuri-user notification
                        // Send verification email in background
                        const verifyHtml = getAccountVerificationTemplate(`${data.firstName} ${data.lastName}`, data.email);
                        sendEmail({
                            to: data.email,
                            subject: "Verify your VetCloud Account",
                            html: verifyHtml,
                            text: `Welcome to VetCloud, ${data.firstName}! Please verify your account.`
                        }).catch(console.error);
                        //-------------
                        // Notify admins of new user registration
                        const io = req.app.get("io");
                        import("../models/Notification.js").then(({ createAdminNotification }) => {
                            createAdminNotification(io, {
                                type: "new_user_registration",
                                title: "New User Registered",
                                message: `New Pet Owner/Farmer registered: ${data.firstName} ${data.lastName} (${data.email}).`
                            });
                        }).catch(console.error);
                        // Automatically log in the user after creation
                        getUserByEmailAndRole(data.email, "farmer", (fetchErr, userResults) => {
                            if (fetchErr || userResults.length === 0) {
                                return res.status(201).json({ message: "Pet Owner registered successfully. Please log in manually." });
                            }
                            issueTokenAndSession(req, res, userResults[0], "farmer");
                        });
                    }
                );
            } 
            // ROUTE B: Veterinarian Registration
            else if (data.role === "Veterinary Doctor") {
                createVeterinarian(
                    {
                        email: data.email,
                        password: hashedPassword,
                        firstName: data.firstName, 
                        lastName: data.lastName,
                        contact_No: data.contact_No,
                        license_number: data.license_number,
                        specialization: data.specialization,
                        years_of_experience: data.years_of_experience,
                        consultation_fee: data.consultation_fee,
                        image: imagePath,
                        provider: 'local'
                    },
                    (err, result) => {
                        if (err) {
                            // Check for unique license number error
                            if (err.code === 'ER_DUP_ENTRY') {
                                return res.status(400).json({ message: "License number is already registered." });
                            }
                            return res.status(500).json(err);
                        }
                        //isuri-user notification
                         // Send verification email in background
                        const verifyHtml = getAccountVerificationTemplate(`${data.firstName} ${data.lastName}`, data.email);
                        sendEmail({
                            to: data.email,
                            subject: "Verify your VetCloud Account",
                            html: verifyHtml,
                            text: `Welcome to VetCloud, ${data.firstName}! Please verify your account.`
                        }).catch(console.error);
                        //---------
                        // Notify admins of new veterinarian registration request
                        const io = req.app.get("io");
                        import("../models/Notification.js").then(({ createAdminNotification }) => {
                            createAdminNotification(io, {
                                type: "new_vet_registration",
                                title: "New Vet Registration Request",
                                message: `New veterinarian registered: Dr. ${data.firstName} ${data.lastName} (${data.email}, License: ${data.license_number}). Pending approval.`
                            });
                        }).catch(console.error);
                        // Do not automatically log in if they are inactive (which they are by default)
                        getUserByEmailAndRole(data.email, "doctor", (fetchErr, userResults) => {
                            return res.status(201).json({ 
                                message: "Veterinarian registered successfully. Please wait for administrator approval to log in." 
                            });
                        });
                    }
                );
            } 
            // Invalid Role Fallback
            else {
                return res.status(400).json({ message: "Invalid user role specified." });
            }

        } catch (hashError) {
            return res.status(500).json({ message: "Internal server error during processing." });
        }
    });
}


// 4. STANDARD LOGIN FUNCTION (UPDATED WITH 2FA)
export async function loginUser(req, res) {
    const { email, password, role } = req.body;

    // Basic validation
    if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required." });
    }

    // Fetch user from the appropriate table
    getUserByEmailAndRole(email, role, async (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error during login." });
        }

        // Check if user exists
        if (results.length === 0) {
            return res.status(404).json({ message: "User not found. Check your email or role." });
        }

        const user = results[0];

        try {
            // Verify the hashed password
            if (!user.password) {
                return res.status(401).json({ message: "Please log in using Google or Facebook." });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid credentials." });
            }

            // --- 2FA SECURITY CHECKPOINT ---
            if (user.is_two_factor_enabled) {
                // If 2FA is ON, stop here! Send a signal to React to show the 6-digit input box.
                return res.status(200).json({
                    message: "2FA Required",
                    requires2FA: true,
                    userId: user.id,
                    role: role
                });
            }
            if (role === "doctor" && !user.is_Active) {
                const pendingToken = jwt.sign(
                    { id: user.id, email: user.email, role: role, isPending: true },
                    process.env.JWT_SECRET,
                    { expiresIn: "7d" }
                );
                return res.status(403).json({ 
                    message: "Your account is currently inactive. Please wait for administrator approval.",
                    pendingToken: pendingToken,
                    email: user.email,
                    role: role
                });
            }

            // 1. Generate the JWT Token
            console.log("STEP 1: Generating Token...");
            const token = jwt.sign(
                {   id: user.id, 
                    email: user.email,
                    role: role }, 
                process.env.JWT_SECRET
            );

            const rawUserAgent = req.headers['user-agent'] || '';
            const parser = new UAParser(rawUserAgent);
            const cleanDeviceString = `${parser.getBrowser().name || 'Unknown'} on ${parser.getOS().name || 'Unknown'}`;

            // 2. Save the session
            console.log("Attempting to save to database with Device:", cleanDeviceString);
            saveUserSession(user.id, role, cleanDeviceString, token, (err) => {
                if (err) {
                    console.error("Database failed!", err);
                } else {
                    console.log("Session inserted into database!");
                }
            });

            const { password: userPassword, ...safeUserData } = user;
            safeUserData.role = req.body.role;

            return res.status(200).json({
                message: "Login successful",
                token: token,
                user: safeUserData
            });

        } catch (error) {
            console.error("Error during password verification:", error);
            return res.status(500).json({ message: "Server error during password verification." });
        }
    });
}

// 4.5. CHECK PENDING STATUS AND AUTO-LOGIN
export async function checkPendingStatus(req, res) {
    const { pendingToken } = req.body;
    if (!pendingToken) {
        return res.status(400).json({ message: "Pending token is required." });
    }

    try {
        // Verify the temporary pending token
        const decoded = jwt.verify(pendingToken, process.env.JWT_SECRET);
        if (!decoded.isPending) {
            return res.status(400).json({ message: "Invalid token type." });
        }

        // Fetch user status based on credentials in the token
        getUserByEmailAndRole(decoded.email, decoded.role, (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Database error checking status." });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: "User not found." });
            }

            const user = results[0];

            // If the user status has been updated to active (is_Active = 1)
            if (user.is_Active) {
                // 1. Generate the standard active JWT Token
                const token = jwt.sign(
                    {   id: user.id, 
                        email: user.email,
                        role: decoded.role }, 
                    process.env.JWT_SECRET
                );

                const rawUserAgent = req.headers['user-agent'] || '';
                const parser = new UAParser(rawUserAgent);
                const cleanDeviceString = `${parser.getBrowser().name || 'Unknown'} on ${parser.getOS().name || 'Unknown'}`;

                // 2. Save session details in the database
                saveUserSession(user.id, decoded.role, cleanDeviceString, token, (err) => {
                    if (err) {
                        console.error("Database failed to save auto-login session!", err);
                    }
                });

                const { password: userPassword, ...safeUserData } = user;
                safeUserData.role = decoded.role;

                return res.status(200).json({
                    approved: true,
                    message: "Login successful",
                    token: token,
                    user: safeUserData
                });
            } else {
                // Still inactive/pending
                return res.status(200).json({
                    approved: false,
                    message: "Your account is currently inactive. Please wait for administrator approval."
                });
            }
        });

    } catch (error) {
        console.error("Error during checking pending status:", error);
        return res.status(401).json({ message: "Session expired or invalid token." });
    }
}



// 2. GOOGLE LOGIN / REGISTRATION
export async function googleLogin(req, res) {
    const { token, role } = req.body;

    try {
        let email, name, picture;

        // Check if token is an ID Token (JWT format containing exactly 3 segments separated by dots) or an Access Token
        if (token && token.split('.').length === 3) {
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.VITE_GOOGLE_CLIENT_ID, 
            });
            const payload = ticket.getPayload();
            email = payload.email;
            name = payload.name;
            picture = payload.picture;
        } else {
            // Retrieve user info using the Google Access Token
            const googleResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${token}` }
            });
            email = googleResponse.data.email;
            name = googleResponse.data.name;
            picture = googleResponse.data.picture;
        }

        // Notice we are now passing 'req' so we can read the device info
        handleSocialLogin(req, res, email, name, picture, role, 'google');
    } catch (error) {
        console.error("Google login verification failed:", error.response?.data || error.message || error);
        return res.status(401).json({ message: "Invalid Google Token" });
    }
}


// 3. FACEBOOK LOGIN / REGISTRATION
export async function facebookLogin(req, res) {
    const { accessToken, role } = req.body;

    try {
        // Fetch user details from Facebook Graph API using the token
        const fbResponse = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`);
        const { email, name, picture } = fbResponse.data;
        const imageUrl = picture?.data?.url || "/default.jpg";

        // Notice we are now passing 'req' here too
        handleSocialLogin(req, res, email, name, imageUrl, role, 'facebook');
    } catch (error) {
        return res.status(401).json({ message: "Invalid Facebook Token" });
    }
}

// --- Helper Function to avoid repeating code for Social Logins ---
function handleSocialLogin(req, res, email, name, image, role, provider) {
    const nameParts = name.split(" ");
    const splitFirstName = nameParts[0] || "";
    const splitLastName = nameParts.slice(1).join(" ") || "";
    
    // First lookup: check if user exists in pet_owners (farmer)
    getUserByEmailAndRole(email, "farmer", (errFarmer, farmerResults) => {
        if (errFarmer) {
            console.error("Farmer lookup failed during social login:", errFarmer);
            return res.status(500).json({ message: "Database error during social login." });
        }

        if (farmerResults && farmerResults.length > 0) {
            // User exists as a farmer! Log them in.
            return issueTokenAndSession(req, res, farmerResults[0], "farmer");
        }

        // Second lookup: check if user exists in veterinarians (doctor)
        getUserByEmailAndRole(email, "doctor", (errDoctor, doctorResults) => {
            if (errDoctor) {
                console.error("Doctor lookup failed during social login:", errDoctor);
                return res.status(500).json({ message: "Database error during social login." });
            }

            if (doctorResults && doctorResults.length > 0) {
                // User exists as a doctor! Log them in.
                return issueTokenAndSession(req, res, doctorResults[0], "doctor");
            }

            // No existing user found: proceed to register as a new user with selected role
            const dbRole = (role === "Farmer/PetOwner" || role === "farmer") ? "farmer" : "doctor";
            const userData = { 
                email, 
                password: null, 
                firstName: splitFirstName, 
                lastName: splitLastName, 
                image, 
                provider,
                contact_No: "",
                license_number: "TEMP-" + Math.random().toString(36).substring(2, 11).toUpperCase(),
                specialization: "General"
            };
            
            const callback = (regErr, result) => {
                if (regErr) return res.status(500).json(regErr);
                
                // Fetch the newly created user to issue a proper session
                getUserByEmailAndRole(email, dbRole, (fetchErr, userResults) => {
                    if (fetchErr || userResults.length === 0) return res.status(500).json({ message: "Database error during social registration." });
                    issueTokenAndSession(req, res, userResults[0], dbRole);
                });
            };

            if (dbRole === "farmer") {
                createPetOwner(userData, callback);
            } else {
                createVeterinarian(userData, callback);
            }
        });
    });
}


// --- Standardized Function to Generate Token & Save Session ---
function issueTokenAndSession(req, res, user, role) {
    if (role === "doctor" && !user.is_Active) {
        return res.status(403).json({ message: "Your account is currently inactive. Please wait for administrator approval." });
    }
    // 1. Generate the JWT Token
    const token = jwt.sign(
        { id: user.id, email: user.email, role: role }, 
        process.env.JWT_SECRET
    );

    // 2. Parse the User-Agent for device info
    const rawUserAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(rawUserAgent);
    const cleanDeviceString = `${parser.getBrowser().name || 'Unknown'} on ${parser.getOS().name || 'Unknown'}`;

    // 3. Save the session to the database
    saveUserSession(user.id, role, cleanDeviceString, token, (err) => {
        if (err) console.error("Failed to save session:", err);
    });

    // 4. Clean sensitive data and send response to React
    const { password, two_factor_secret, ...safeUserData } = user;
    safeUserData.role = role;

    return res.status(200).json({
        message: "Login successful",
        token: token,
        user: safeUserData
    });
}

//Navindu 2026/05/27 ... Forgot Password Functionality

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

//sending OTP
export function sendForgotPasswordOTP(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    checkEmailExists(email, async (err, results) => {

        if (err) {
            return res.status(500).json(err);
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "No account found with this email"
            });
        }

        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        savePasswordResetOTP(email, otp, expiresAt, async (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: "VetCloud Password Reset OTP",
                    html: `
                        <h2>Password Reset Request</h2>
                        <p>Your OTP code is:</p>
                        <h1>${otp}</h1>
                        <p>This OTP expires in 10 minutes.</p>
                    `
                });

                return res.status(200).json({
                    message: "OTP sent successfully"
                });

            } catch (error) {
                console.error("EMAIL ERROR:", error);
                return res.status(500).json({
                    message: "Failed to send email",
                    error: error.message
                });
            }
        });
    });
}

//verify Forgot PasswordOTP
export function verifyForgotPasswordOTP(req, res) {

    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            message: "Email and OTP required"
        });
    }

    verifyOTP(email, otp, (err, results) => {

        if (err) {
            return res.status(500).json(err);
        }

        if (results.length === 0) {
            return res.status(400).json({
                message: "Invalid or expired OTP"
            });
        }

        return res.status(200).json({
            message: "OTP verified successfully"
        });
    });
}

//RESET PASSWORD
export async function resetPassword(req, res) {

    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({
            message: "Missing fields"
        });
    }

    try {

        const hashedPassword = await bcrypt.hash(newPassword, 11);

        updatePetOwnerPassword(email, hashedPassword, (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (result.affectedRows > 0) {
                return res.status(200).json({
                    message: "Password updated successfully"
                });
            }

            updateVeterinarianPassword(email, hashedPassword, (err2, result2) => {

                if (err2) {
                    return res.status(500).json(err2);
                }

                if (result2.affectedRows > 0) {
                    return res.status(200).json({
                        message: "Password updated successfully"
                    });
                }

                return res.status(404).json({
                    message: "User not found"
                });
            });
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error"
        });
    }
}
//... Navindu

//Hemalsha 2026/05/30 ... Profile Picture Upload Functionality
export const updateProfilePhoto = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    // 1. Get the JWT token from the Request Headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // 2. Decode the token to get the user's ID and Role
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const userRole = decoded.role;

        // 3. Create the URL
        const imageUrl = `/uploads/${req.file.filename}`;

        // 4. Update the Database
        updateUserImage(userId, userRole, imageUrl, (err, result) => {
            if (err) return res.status(500).json({ message: "Database error" });
            
            res.status(200).json({ 
                message: "Image uploaded successfully", 
                imageUrl: imageUrl 
            });
        });

    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

export const removeProfilePhoto = (req, res) => {
    // 1. Get and verify the JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const userRole = decoded.role;
        const defaultImage = "/default.jpg"; // The factory default image

        // 2. Update the Database back to the default image
        updateUserImage(userId, userRole, defaultImage, (err, result) => {
            if (err) return res.status(500).json({ message: "Database error" });
            
            res.status(200).json({ 
                message: "Profile photo removed successfully", 
                imageUrl: defaultImage 
            });
        });

    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};
//... Hemalsha

export const updateUserProfile = (req, res) => {
    // 1. Verify the user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // 2. Decode token to get ID and Role
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const userRole = decoded.role;
        const profileData = req.body; // The payload we sent from React

        // 3. Route to the correct database update function
        if (userRole === "Farmer/PetOwner" || userRole === "farmer") {
            
            updatePetOwnerProfile(userId, profileData, (err, result) => {
                if (err) return res.status(500).json({ message: "Database error during update" });
                
                // Send security alert email
                getUserByIdAndRole(userId, 'farmer', (errUser, userInfo) => {
                    if (!errUser && userInfo) {
                        sendEmail({
                            to: userInfo.email,
                            subject: "Security Alert: Profile Information Updated",
                            html: `<h3>Profile Updated</h3><p>Dear ${userInfo.fullName}, your VetCloud account profile information has been successfully updated.</p>`,
                            text: `Dear ${userInfo.fullName}, your VetCloud account profile information has been updated.`
                        }).catch(console.error);
                    }
                });

                return res.status(200).json({ message: "Profile updated successfully" });
            });

        } else if (userRole === "Veterinary Doctor" || userRole === "doctor") {
            
            updateVeterinarianProfile(userId, profileData, (err, result) => {
                if (err) return res.status(500).json({ message: "Database error during update" });
                
                // Send security alert email
                getUserByIdAndRole(userId, 'doctor', (errUser, userInfo) => {
                    if (!errUser && userInfo) {
                        sendEmail({
                            to: userInfo.email,
                            subject: "Security Alert: Profile Information Updated",
                            html: `<h3>Profile Updated</h3><p>Dear ${userInfo.fullName}, your VetCloud account profile information has been successfully updated.</p>`,
                            text: `Dear ${userInfo.fullName}, your VetCloud account profile information has been updated.`
                        }).catch(console.error);
                    }
                });

                return res.status(200).json({ message: "Profile updated successfully" });
            });

        } else {
            return res.status(400).json({ message: "Invalid user role" });
        }

    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// --- Fetch User Profile Data ---
export const getUserProfile = (req, res) => {
    // 1. Get the token from the request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // 2. Decrypt the token to find out who this user is
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const userRole = decoded.role;

        // 3. Route to the correct database fetch based on their role
        if (userRole === "Farmer/PetOwner" || userRole === "farmer") {
            
            getFullPetOwnerProfile(userId, (err, profileData) => {
                if (err) {
                    console.error("Database Error:", err);
                    return res.status(500).json({ message: "Error fetching profile" });
                }
                if (!profileData) {
                    return res.status(404).json({ message: "Profile not found in database" });
                }
                
                // Success! Send the data back to React
                return res.status(200).json(profileData);
            });

        } else if (userRole === "Veterinary Doctor" || userRole === "doctor") {
            getFullVeterinarianProfile(userId, (err, profileData) => {
                if (err) {
                    console.error("Database Error:", err);
                    return res.status(500).json({ message: "Error fetching profile" });
                }
                if (!profileData) {
                    return res.status(404).json({ message: "Profile not found in database" });
                }
                return res.status(200).json(profileData);
            });
        } else {
            return res.status(400).json({ message: "Invalid user role" });
        }

    } catch (error) {
        console.error("Token Error:", error);
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
};

//change password
export const changePassword = (req, res) => {
    // 1. Verify the User Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const userRole = decoded.role;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Please provide both current and new passwords" });
        }

        // 2. Fetch the current encrypted password from the DB
        getUserPasswordById(userId, userRole, async (err, dbPasswordHash) => {
            if (err) return res.status(500).json({ message: "Database error" });

            // 3. Compare the typed current password with the database hash
            const isMatch = await bcrypt.compare(currentPassword, dbPasswordHash);
            if (!isMatch) {
                return res.status(400).json({ message: "Incorrect current password" });
            }

            // 4. Hash the NEW password
            const salt = await bcrypt.genSalt(10);
            const newHashedPassword = await bcrypt.hash(newPassword, salt);

            // 5. Save the new hashed password to the database
            updateUserPasswordById(userId, userRole, newHashedPassword, (updateErr, result) => {
                if (updateErr) return res.status(500).json({ message: "Failed to update password" });
                return res.status(200).json({ message: "Password changed successfully" });
            });
        });

    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};


// Generate the Secret and QR Code
export const generate2FA = async (req, res) => {
    const secret = speakeasy.generateSecret({ name: 'VetCloud' });
    
    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
        if (err) return res.status(500).json({ message: "Error generating QR code" });
        // Send the QR code and the raw secret back to React temporarily
        res.status(200).json({ qrCodeUrl: data_url, secret: secret.base32 });
    });
};


// Verify and Enable 2FA
export const verifyAndEnable2FA = (req, res) => {
    // 1. Get the user from the JWT Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const jwtToken = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
        const userId = decoded.id;
        const userRole = decoded.role;
        
        // 'token' here is the 6-digit code they typed
        const { token, secret } = req.body; 

        // 2. Do the math to verify the 6-digit code
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            // 3. ACTUALLY SAVE IT TO THE DATABASE!
            enableUser2FA(userId, userRole, secret, (err) => {
                if (err) return res.status(500).json({ message: "Failed to save to database" });
                
                // Send security alert email
                getUserByIdAndRole(userId, userRole === 'Veterinary Doctor' || userRole === 'doctor' ? 'doctor' : 'farmer', (errUser, userInfo) => {
                    if (!errUser && userInfo) {
                        sendEmail({
                            to: userInfo.email,
                            subject: "Security Alert: Two-Factor Authentication Enabled",
                            html: `<h3>Two-Factor Authentication Enabled</h3><p>Dear ${userInfo.fullName}, Two-Factor Authentication (2FA) has been enabled on your VetCloud account. If you did not make this change, please contact VetCloud support immediately.</p>`,
                            text: `Dear ${userInfo.fullName}, Two-Factor Authentication (2FA) has been enabled on your VetCloud account.`
                        }).catch(console.error);
                    }
                });

                return res.status(200).json({ message: "2FA Enabled Successfully!" });
            });
        } else {
            return res.status(400).json({ message: "Invalid 6-digit code" });
        }
    } catch (error) {
        return res.status(401).json({ message: "Invalid session token" });
    }
};
// export const verifyLogin2FA = (req, res) => {
//     const { userId, role, code } = req.body;

//     if (!userId || !role || !code) {
//         return res.status(400).json({ message: "Missing required information" });
//     }

//     // 1. Ask the Model to fetch the user's secret from the database
//     getUserByIdAndRole(userId, role, (err, user) => {
//         if (err || !user) {
//             console.error("Database Error during 2FA:", err);
//             return res.status(500).json({ message: "Database error or user not found" });
//         }

//         // 2. Verify the 6-digit code against their saved secret
//         const verified = speakeasy.totp.verify({
//             secret: user.two_factor_secret,
//             encoding: 'base32',
//             token: code
//         });

//         if (verified) {
//             // 3. Success! Issue the real JWT Token
//             const token = jwt.sign(
//                 { id: user.id, email: user.email, role: role }, 
//                 process.env.JWT_SECRET
//             );

//             // Remove sensitive data before sending it to React
//             const { password, two_factor_secret, ...safeUserData } = user;
//             safeUserData.role = role;

//             return res.status(200).json({ 
//                 message: "Login successful",
//                 token: token, 
//                 user: safeUserData 
//             });
//         } else {
//             return res.status(400).json({ message: "Invalid 6-digit code" });
//         }
//     });
// };

export const verifyLogin2FA = (req, res) => {
    const { userId, role, code } = req.body;

    if (!userId || !role || !code) {
        return res.status(400).json({ message: "Missing required information" });
    }

    // 1. Ask the Model to fetch the user's secret from the database
    getUserByIdAndRole(userId, role, (err, user) => {
        if (err || !user) {
            console.error("Database Error during 2FA:", err);
            return res.status(500).json({ message: "Database error or user not found" });
        }

        // 2. Verify the 6-digit code against their saved secret
        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: code
        });

        if (verified) {
            // 3. Success! Issue the real JWT Token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: role }, 
                process.env.JWT_SECRET
            );

            // --- THE MISSING PIECE: Save the Session! ---
            const rawUserAgent = req.headers['user-agent'] || '';
            const parser = new UAParser(rawUserAgent);
            const cleanDeviceString = `${parser.getBrowser().name || 'Unknown'} on ${parser.getOS().name || 'Unknown'}`;

            saveUserSession(user.id, role, cleanDeviceString, token, (err) => {
                if (err) console.error("Failed to save 2FA session:", err);
            });
            // --------------------------------------------

            // Remove sensitive data before sending it to React
            const { password, two_factor_secret, ...safeUserData } = user;
            safeUserData.role = role;

            return res.status(200).json({ 
                message: "Login successful",
                token: token, 
                user: safeUserData 
            });
        } else {
            return res.status(400).json({ message: "Invalid 6-digit code" });
        }
    });
};

// --- Disable 2FA Controller ---
export const disable2FA = (req, res) => {
    // 1. Verify the User Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // 2. Decode the token to get the ID and Role
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const userRole = decoded.role;

        // 3. Ask the Database to wipe the 2FA settings
        disableUser2FA(userId, userRole, (err) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ message: "Failed to disable 2FA in database" });
            }
            
            // Send security alert email
            getUserByIdAndRole(userId, userRole === 'Veterinary Doctor' || userRole === 'doctor' ? 'doctor' : 'farmer', (errUser, userInfo) => {
                if (!errUser && userInfo) {
                    sendEmail({
                        to: userInfo.email,
                        subject: "Security Alert: Two-Factor Authentication Disabled",
                        html: `<h3>Two-Factor Authentication Disabled</h3><p>Dear ${userInfo.fullName}, Two-Factor Authentication (2FA) has been disabled on your VetCloud account. If you did not make this change, please contact VetCloud support immediately.</p>`,
                        text: `Dear ${userInfo.fullName}, Two-Factor Authentication (2FA) has been disabled on your VetCloud account.`
                    }).catch(console.error);
                }
            });

            return res.status(200).json({ message: "Two-Factor Authentication disabled successfully." });
        });

    } catch (error) {
        return res.status(401).json({ message: "Invalid session token" });
    }
};


// --- Fetch All Active Sessions ---
export const getActiveSessions = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    
    const currentToken = authHeader.split(" ")[1];
    
    try {
        const decoded = jwt.verify(currentToken, process.env.JWT_SECRET);

        getUserSessions(decoded.id, decoded.role, (err, results) => {
            if (err) return res.status(500).json({ message: "Database error" });

            const formattedSessions = results.map(session => ({
                id: session.id,
                device: session.device,
                location: session.location,
                time: session.login_time,
                isCurrent: session.token === currentToken 
            }));

            res.status(200).json(formattedSessions);
        });
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// --- Revoke a Specific Session ---
export const revokeSession = (req, res) => {
    const sessionId = req.params.id; 
    
    deleteSessionById(sessionId, (err) => {
        if (err) return res.status(500).json({ message: "Failed to revoke session" });
        res.status(200).json({ message: "Session revoked successfully" });
    });
};

// --- Revoke All Other Sessions ---
export const revokeOtherSessions = (req, res) => {
    const authHeader = req.headers.authorization;
    const currentToken = authHeader.split(" ")[1];
    
    try {
        const decoded = jwt.verify(currentToken, process.env.JWT_SECRET);

        deleteOtherSessions(decoded.id, decoded.role, currentToken, (err) => {
            if (err) return res.status(500).json({ message: "Failed to revoke other sessions" });
            res.status(200).json({ message: "All other sessions signed out" });
        });
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};



//Navindu 2026/06/10 ... get vet details for scheduling appointments
export const getAllVets = (req, res) => {
    const sql = `
        SELECT v.id, v.fullName, v.specialization, v.years_of_experience, v.consultation_fee, v.image,
               COALESCE(ROUND(AVG(f.rating), 1), 5.0) AS rating
        FROM veterinarians v
        LEFT JOIN feedbacks f ON v.id = f.veterinarian_id
        WHERE v.is_Active = 1
        GROUP BY v.id
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error", err });
        }

        const vets = results.map(v => ({
            id: v.id,
            name: `Dr. ${v.fullName}`,
            spec: v.specialization,
            exp: `${v.years_of_experience} Years`,
            rating: parseFloat(v.rating),
            available: true,
            image: v.image || "/default.jpg"
        }));

        res.json(vets);
    });
};


export const savePayoutSettings = (req, res) => {
    // 1. Check for the security badge (Token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // 2. Read the badge to see which doctor this is
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const vetId = decoded.id;
        
        // 3. Send the data to the Payment Model to save in the database
        updatePayoutSettings(vetId, req.body, (err, result) => {
            if (err) {
                console.error("Database Error:", err.sqlMessage || err);
                return res.status(500).json({ message: "Database error saving payouts" });
            }
            return res.status(200).json({ message: "Payout details updated successfully!" });
        });
        
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};


 
export const saveConsultationFees = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        updateConsultationFees(decoded.id, req.body, (err, result) => {
            if (err) {
                console.error("DB error saving fees:", err.sqlMessage || err);
                return res.status(500).json({ message: "Database error saving fees" });
            }
            return res.status(200).json({ message: "Consultation fees updated successfully!" });
        });
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const saveClinicDetails = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        updateClinicDetails(decoded.id, req.body, (err, result) => {
            if (err) {
                console.error("DB error saving clinic details:", err.sqlMessage || err);
                return res.status(500).json({ message: "Database error saving clinic details" });
            }
            return res.status(200).json({ message: "Clinic details updated successfully!" });
        });
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const submitFeedback = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const userRole = decoded.role;

        // Check if role is pet owner
        if (userRole !== "Farmer/PetOwner" && userRole !== "farmer") {
            return res.status(403).json({ message: "Only pet owners can submit feedback" });
        }

        const { veterinarianId, rating, comment } = req.body;

        if (!rating) {
            return res.status(400).json({ message: "Rating is required" });
        }

        const insertSql = `
            INSERT INTO feedbacks (pet_owner_id, veterinarian_id, rating, comment)
            VALUES (?, ?, ?, ?)
        `;

        db.query(insertSql, [userId, veterinarianId || null, rating, comment || null], (err, result) => {
            if (err) {
                console.error("Error inserting feedback:", err);
                return res.status(500).json({ message: "Database error submitting feedback", err });
            }

            // Trigger Admin in-app notification of new feedback/review received
            const io = req.app.get("io");
            import("../models/Notification.js").then(({ createAdminNotification }) => {
                createAdminNotification(io, {
                    type: "new_feedback_received",
                    title: "New Feedback Received",
                    message: `New feedback received (Rating: ${rating}/5) for Vet ID: ${veterinarianId}.`
                });
            }).catch(console.error);

            return res.status(201).json({ message: "Feedback submitted successfully, awaiting approval!" });
        });
    } catch (error) {
        console.error("Token verification error in submitFeedback:", error);
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

export const submitComplaint = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required." });
        }

        // Save complaint to DB
        import("../models/Notification.js").then(({ createComplaint, createAdminNotification }) => {
            createComplaint({
                userId: decoded.id,
                userRole: decoded.role === 'Veterinary Doctor' || decoded.role === 'doctor' ? 'doctor' : 'farmer',
                title,
                description
            }, (err, result) => {
                if (err) {
                    console.error("DB error inserting complaint:", err);
                    return res.status(500).json({ message: "Failed to submit complaint" });
                }

                // Trigger Admin alert
                const io = req.app.get("io");
                createAdminNotification(io, {
                    type: "customer_complaint",
                    title: "New Customer Complaint",
                    message: `New complaint: "${title}" submitted by ${decoded.role} ID: ${decoded.id}.`
                });

                return res.status(201).json({ message: "Complaint submitted successfully!", data: result });
            });
        }).catch(console.error);

    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const getVetFeedback = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Veterinarian ID is required" });
    }

    const sql = `
        SELECT f.id, f.rating, f.comment, f.created_at, p.fullName AS ownerName
        FROM feedbacks f
        LEFT JOIN pet_owners p ON f.pet_owner_id = p.id
        WHERE f.veterinarian_id = ?
        ORDER BY f.created_at DESC
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Error fetching veterinarian feedback:", err);
            return res.status(500).json({ message: "Failed to fetch feedback", error: err });
        }
        res.status(200).json(results);
    });
};

export const getHomepageFeedback = (req, res) => {
    const sql = `
        SELECT f.id, f.rating, f.comment, f.created_at, 
               p.fullName AS ownerName, p.image AS ownerImage, 'Farmer / Pet Owner' AS ownerRole
        FROM feedbacks f
        JOIN pet_owners p ON f.pet_owner_id = p.id
        WHERE f.show_on_homepage = 1
        ORDER BY f.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching homepage feedback:", err);
            return res.status(500).json({ message: "Failed to fetch homepage feedback", error: err });
        }
        res.status(200).json(results);
    });
};
//... Navindu


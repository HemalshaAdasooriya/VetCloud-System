// controllers/userController.js
import dotenv from "dotenv";
dotenv.config();
import { createPetOwner, createVeterinarian, checkEmailExists, getUserByEmailAndRole } from "../models/user.js";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import jwt from "jsonwebtoken";
//Navindu 2026/05/27 ... Forgot Password Functionality
import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";

import {
    savePasswordResetOTP,
    verifyOTP,
    updatePetOwnerPassword,
    updateVeterinarianPassword,
    updateUserImage
} from "../models/User.js";
//... Navindu


//Navindu 2026/05/27 ... Forgot Password Functionality

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


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


const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

export function registerUser(req, res) {
    const data = req.body;

    // 1. Basic validation
    if (!data.email || !data.password || !data.fullName || !data.role) {
        return res.status(400).json({
            message: "Missing required fields."
        });
    }

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
                        fullName: data.fullName, 
                        contact_No: data.contact_No,
                        address: data.address,
                        numberOfAnimals: data.numberOfAnimals, // Matched to frontend payload exactly
                        provider: 'local'
                    },
                    (err, result) => {
                        if (err) return res.status(500).json(err);
                        return res.status(201).json({ message: "Pet Owner registered successfully" });
                    }
                );
            } 
            // ROUTE B: Veterinarian Registration
            else if (data.role === "Veterinary Doctor") {
                createVeterinarian(
                    {
                        email: data.email,
                        password: hashedPassword,
                        fullName: data.fullName,
                        contact_No: data.contact_No,
                        license_number: data.license_number,
                        specialization: data.specialization,
                        years_of_experience: data.years_of_experience,
                        consultation_fee: data.consultation_fee,
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
                        return res.status(201).json({ message: "Veterinarian registered successfully" });
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

// 4. STANDARD LOGIN FUNCTION
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
            // Note: If registering via Google/Facebook, password might be NULL
            if (!user.password) {
                return res.status(401).json({ message: "Please log in using Google or Facebook." });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid credentials." });
            }

            
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email, 
                    role: role 
                }, 
                process.env.JWT_SECRET, 
                // { expiresIn: "24h" }
            );

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

// 2. GOOGLE LOGIN / REGISTRATION
export async function googleLogin(req, res) {
    const { token, role } = req.body;

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.VITE_GOOGLE_CLIENT_ID, 
        });
        const payload = ticket.getPayload();
        
        handleSocialLogin(res, payload.email, payload.name, payload.picture, role, 'google');
    } catch (error) {
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

        handleSocialLogin(res, email, name, imageUrl, role, 'facebook');
    } catch (error) {
        return res.status(401).json({ message: "Invalid Facebook Token" });
    }
}

// --- Helper Function to avoid repeating code for Social Logins ---
function handleSocialLogin(res, email, name, image, role, provider) {
    checkEmailExists(email, (err, results) => {
        if (err) return res.status(500).json(err);

        if (results.length > 0) {
            // User already exists in DB -> Log them in!
            return res.status(200).json({ message: "Login successful", email, role });
        } else {
            // New user -> Register them instantly
            const userData = { email, password: null, fullName: name, image, provider };
            
            if (role === "Farmer/PetOwner") {
                createPetOwner(userData, (err, result) => {
                    if (err) return res.status(500).json(err);
                    return res.status(201).json({ message: `Registered via ${provider}` });
                });
            } else if (role === "Veterinary Doctor") {
                createVeterinarian(userData, (err, result) => {
                    if (err) return res.status(500).json(err);
                    return res.status(201).json({ message: `Registered via ${provider}` });
                });
            }
        }
    });
}


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
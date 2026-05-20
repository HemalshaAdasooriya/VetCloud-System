// controllers/userController.js
import { createPetOwner, createVeterinarian, checkEmailExists } from "../models/user.js";
import bcrypt from "bcryptjs";

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
                        numberOfAnimals: data.numberOfAnimals // Matched to frontend payload exactly
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
                        consultation_fee: data.consultation_fee
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
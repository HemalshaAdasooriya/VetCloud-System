import { createUser, getUserByEmail } from "../models/User.js";
import bcrypt from "bcryptjs";

export function registerUser(req, res) {
    const data = req.body;

    // email and password validation
    if (!data.email || !data.password) {
        return res.status(400).json({
            message: "Email and password are required fields."
        });
    }

    //email format validation
    getUserByEmail(data.email, (err, results) => {
        if (err) {
            return res.status(500).json(err);
        }

        if (results.length > 0) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

    // Passes all the collected data
        try {
            const hashedPassword = bcrypt.hashSync(data.password, 11);

            createUser(
                {
                    email: data.email,
                    password: hashedPassword,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: data.role,
                    contact_No: data.contact_No, 
                    address: data.address,
                    image: data.image
                },
                (err, result) => {
                    if (err) {
                        return res.status(500).json(err);
                    }

                    return res.status(201).json({
                        message: "User registered successfully"
                    });
                }
            );
        } catch (hashError) {
            return res.status(500).json({ message: "Internal server error during processing." });
        }
    });
}

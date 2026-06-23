import db from "./config/db.js";

db.query("SELECT id, email, fullName, contact_No, provider FROM pet_owners WHERE provider = 'google'", (err, owners) => {
    if (err) {
        console.error("Error fetching pet_owners:", err);
    } else {
        console.log("Google Pet Owners:", owners);
    }

    db.query("SELECT id, email, fullName, contact_No, license_number, specialization, provider FROM veterinarians WHERE provider = 'google'", (err, vets) => {
        if (err) {
            console.error("Error fetching veterinarians:", err);
        } else {
            console.log("Google Veterinarians:", vets);
        }
        process.exit(0);
    });
});

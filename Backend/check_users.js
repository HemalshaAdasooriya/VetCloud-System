import db from "./config/db.js";

console.log("Querying pet_owners...");
db.query("SELECT id, fullName, email, isEmailVerified FROM pet_owners LIMIT 5", (err, owners) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Pet Owners:", owners);
    }

    console.log("Querying veterinarians...");
    db.query("SELECT id, fullName, email, isEmailVerified FROM veterinarians LIMIT 5", (err2, vets) => {
        if (err2) {
            console.error(err2);
        } else {
            console.log("Veterinarians:", vets);
        }
        db.end();
    });
});

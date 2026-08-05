import db from "../config/db.js";

// Ensure diseases table exists
export const initializeDiseasesTable = () => {
    const createDiseasesTableSql = `
        CREATE TABLE IF NOT EXISTS diseases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            species TEXT,
            category VARCHAR(100) DEFAULT 'General',
            risk VARCHAR(50) DEFAULT 'Medium Risk',
            image TEXT,
            symptoms TEXT,
            prevention TEXT,
            treatment TEXT,
            description TEXT,
            transmission TEXT,
            incubation VARCHAR(255),
            clinicalSigns TEXT,
            preventionSteps TEXT,
            treatmentSteps TEXT,
            emergencyProtocol TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    db.query(createDiseasesTableSql, (err) => {
        if (err) {
            console.error("Error creating diseases table:", err);
        } else {
            console.log("MySQL 'diseases' table verified.");
        }
    });
};

initializeDiseasesTable();

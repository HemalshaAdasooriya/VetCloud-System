import mysql from "mysql2";

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "vetcloud"
});

db.connect((err) => {

    if(err){
        console.log("Database connection failed");
        console.log(err);
    }else{
        console.log("MySQL Connected");

// myanimalpage //
       // myanimalpage //
        const createAnimalsTable = `
            CREATE TABLE IF NOT EXISTS \`animals\` (
              \`id\` INT AUTO_INCREMENT PRIMARY KEY,
              \`owner_id\` INT NOT NULL,
              \`name\` VARCHAR(100) NOT NULL,
              \`species\` VARCHAR(50) NOT NULL,
              \`breed\` VARCHAR(100) NOT NULL,
              \`age\` VARCHAR(50) NOT NULL,
              \`weight\` VARCHAR(50) NOT NULL,
              \`status\` VARCHAR(50) NOT NULL DEFAULT 'Healthy',
              \`image\` TEXT NULL,
              \`lastVisit\` VARCHAR(50) NULL,
              FOREIGN KEY (\`owner_id\`) REFERENCES \`pet_owners\`(\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `;

        const createHistoryTable = `
            CREATE TABLE IF NOT EXISTS \`animal_medical_histories\` (
              \`id\` INT AUTO_INCREMENT PRIMARY KEY,
              \`animal_id\` INT NOT NULL,
              \`date\` VARCHAR(50) NOT NULL,
              \`type\` VARCHAR(50) NOT NULL,
              \`title\` VARCHAR(255) NOT NULL,
              \`vet\` VARCHAR(100) NOT NULL,
              \`notes\` TEXT NULL,
              FOREIGN KEY (\`animal_id\`) REFERENCES \`animals\`(\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `;

        db.query(createAnimalsTable, (err) => {
            if (err) {
                console.error("Error creating animals table:", err);
            } else {
                db.query(createHistoryTable, (err) => {
                    if (err) {
                        console.error("Error creating medical histories table:", err);
                    }
                });
            }
        });

    }

});
export default db;
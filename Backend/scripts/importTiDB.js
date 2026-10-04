import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from Backend root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const isSslNeeded = process.env.MYSQL_SSL === "true" ||
    (process.env.MYSQLHOST && process.env.MYSQLHOST.includes("tidbcloud.com")) ||
    String(process.env.MYSQLPORT) === "4000";

const dbConfig = {
    host: process.env.MYSQLHOST || "localhost",
    user: process.env.MYSQLUSER || "root",
    password: process.env.MYSQLPASSWORD || "",
    database: process.env.MYSQLDATABASE || "test",
    port: process.env.MYSQLPORT ? parseInt(process.env.MYSQLPORT, 10) : 4000,
    multipleStatements: true,
    ...(isSslNeeded ? {
        ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== "false"
        }
    } : {})
};

async function importSchema() {
    console.log("==========================================");
    console.log("   TiDB Cloud Database Importer");
    console.log("==========================================");
    console.log(`Connecting to: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`User: ${dbConfig.user}`);
    console.log(`Database: ${dbConfig.database}`);
    console.log(`SSL Enabled: ${isSslNeeded ? "Yes" : "No"}`);
    console.log("------------------------------------------");

    if (!process.env.MYSQLHOST || !process.env.MYSQLUSER) {
        console.error("❌ Missing database credentials in .env!");
        console.error("Please ensure MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, and MYSQLDATABASE are set in Backend/.env");
        process.exit(1);
    }

    const sqlFilePath = path.resolve(__dirname, "../../vetcloud.sql");
    if (!fs.existsSync(sqlFilePath)) {
        console.error(`❌ SQL file not found at: ${sqlFilePath}`);
        process.exit(1);
    }

    console.log(`📖 Reading SQL dump from: ${sqlFilePath}`);
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    const connection = mysql.createConnection(dbConfig);

    connection.connect((err) => {
        if (err) {
            console.error("❌ Connection failed:", err.message);
            if (err.message.includes("requires secure connection")) {
                console.error("👉 Tip: TiDB Cloud requires SSL. Make sure MYSQL_SSL=true or host contains 'tidbcloud.com'");
            }
            process.exit(1);
        }

        console.log("✅ Connected to TiDB Cloud successfully!");
        console.log("⏳ Executing SQL schema and seed data (this may take a few seconds)...");

        connection.query(sqlContent, (queryErr, results) => {
            if (queryErr) {
                console.error("❌ Error executing SQL script:", queryErr.message);
                connection.end();
                process.exit(1);
            }

            console.log("✅ Database schema and seed data successfully imported!");

            // Verify tables
            connection.query("SHOW TABLES;", (tblErr, tables) => {
                if (!tblErr && tables) {
                    console.log(`\n📊 Imported ${tables.length} tables:`);
                    const tableNames = tables.map((row) => Object.values(row)[0]);
                    console.log(tableNames.join(", "));
                }
                console.log("\n==========================================");
                console.log("🎉 Setup complete! You can now start the backend with: npm start");
                console.log("==========================================");
                connection.end();
                process.exit(0);
            });
        });
    });
}

importSchema();

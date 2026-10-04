import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const isSslNeeded = process.env.MYSQL_SSL === "true" ||
    (process.env.MYSQLHOST && process.env.MYSQLHOST.includes("tidbcloud.com")) ||
    String(process.env.MYSQLPORT) === "4000";

const dbConfig = {
    host: process.env.MYSQLHOST || "localhost",
    user: process.env.MYSQLUSER || "root",
    password: process.env.MYSQLPASSWORD || "",
    database: process.env.MYSQLDATABASE || "vetcloud",
    port: process.env.MYSQLPORT ? parseInt(process.env.MYSQLPORT, 10) : (isSslNeeded ? 4000 : 3306),
    ...(isSslNeeded ? {
        ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== "false"
        }
    } : {})
};

let connection;
let reconnectTimeout = null;

function handleDisconnect() {
    // Clear any pending reconnect timers
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    connection = mysql.createConnection(dbConfig);

    connection.connect((err) => {
        if (err) {
            console.error("Database connection error:", err.message);
            reconnect();
        } else {
            console.log("MySQL Connected");
        }
    });

    connection.on("error", (err) => {
        console.error("Database error event:", err.message);
        if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNREFUSED" || err.fatal) {
            reconnect();
        }
    });
}

function reconnect() {
    if (reconnectTimeout) return; // Already scheduled reconnect

    if (connection) {
        connection.removeAllListeners();
        try {
            connection.end();
        } catch (e) { }
    }

    console.log("🔄 Reconnecting database in 2 seconds...");
    reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        handleDisconnect();
    }, 2000);
}

handleDisconnect();

const dbWrapper = {
    query: (...args) => connection.query(...args),
    beginTransaction: (...args) => connection.beginTransaction(...args),
    rollback: (...args) => connection.rollback(...args),
    commit: (...args) => connection.commit(...args),
    connect: (...args) => connection.connect(...args)
};

export default dbWrapper;


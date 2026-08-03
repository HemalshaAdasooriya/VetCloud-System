import mysql from "mysql2";

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
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
        } catch (e) {}
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

console.log("Scheduler DB User:", process.env.DB_USER);
console.log("Scheduler DB Host:", process.env.DB_HOST);
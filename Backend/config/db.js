import mysql from "mysql2";

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "vetcloud",
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    keepAliveInitialDelay: 10000,
    enableKeepAlive: true,
    charset: "UTF8MB4_UNICODE_CI",
    ssl: (process.env.DB_SSL === "true" || (process.env.DB_HOST && process.env.DB_HOST.includes("rlwy.net"))) 
        ? { rejectUnauthorized: false } 
        : false
};

const pool = mysql.createPool(dbConfig);

// Test pool connectivity
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database connection error:", err.message);
    } else {
        console.log("✅ MySQL Connected via Connection Pool");
        connection.release();
    }
});

let activeTransactionConn = null;

const dbWrapper = {
    query: (...args) => {
        if (activeTransactionConn) {
            return activeTransactionConn.query(...args);
        }
        return pool.query(...args);
    },
    beginTransaction: (callback) => {
        pool.getConnection((err, conn) => {
            if (err) {
                if (typeof callback === "function") callback(err);
                return;
            }
            activeTransactionConn = conn;
            activeTransactionConn.beginTransaction((txErr) => {
                if (txErr) {
                    activeTransactionConn.release();
                    activeTransactionConn = null;
                    if (typeof callback === "function") callback(txErr);
                    return;
                }
                if (typeof callback === "function") callback(null);
            });
        });
    },
    commit: (callback) => {
        if (!activeTransactionConn) {
            if (typeof callback === "function") callback(null);
            return;
        }
        const conn = activeTransactionConn;
        activeTransactionConn = null;
        conn.commit((err) => {
            conn.release();
            if (typeof callback === "function") callback(err);
        });
    },
    rollback: (callback) => {
        if (!activeTransactionConn) {
            if (typeof callback === "function") callback(null);
            return;
        }
        const conn = activeTransactionConn;
        activeTransactionConn = null;
        conn.rollback((err) => {
            conn.release();
            if (typeof callback === "function") callback(err);
        });
    },
    connect: (callback) => {
        pool.getConnection((err, conn) => {
            if (conn) conn.release();
            if (typeof callback === "function") callback(err);
        });
    }
};

export default dbWrapper;
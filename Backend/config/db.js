import mysql from 'mysql2/promise';

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "vetcloud",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
const testConnection = async () => {
    try {
        const connection = await db.getConnection();
        console.log("MySQL Connected");
        connection.release();
    } catch (err) {
        console.log("Database connection failed");
        console.log(err);
    }
};

testConnection();

export default db;
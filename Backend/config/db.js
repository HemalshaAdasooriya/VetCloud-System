import mysql from "mysql2";

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "vetcloud"
});

db.connect((err) => {

    if(err){
        console.log("Database connection failed");
        console.log(err);
    }else{
        console.log("MySQL Connected");

    }

});
export default db;
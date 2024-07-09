import mysql2 from "mysql2";
import dotenv from "dotenv";
dotenv.config();

export const dbConnection = mysql2.createPool({
  user: process.env.USER,
  database: process.env.DATABASE,
  host: process.env.HOST,
  password: process.env.PASSWORD,
  connectionLimit: 10,
  port: process.env.PORT,
});

const dbConn = dbConnection.promise();
export default dbConn
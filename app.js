// const express = require("express");
// const cors = require("cors");
// const userRoute = require("./routes/userRoute.js");
// const questionRoute = require("./routes/questionRoute.js");
// const answerRoute = require("./routes/answerRoute.js");
// const dbConn = require("./DB/dbConfig.js");
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import userRoute from './routes/userRoute.js';
import questionRoute from './routes/questionRoute.js';
import answerRoute from './routes/answerRoute.js';
import dbConn from './DB/dbConfig.js';
import Install from "./routes/InstallRoutes.js"

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoute);
app.use("/api/questions", questionRoute);
app.use("/api/answers", answerRoute);
app.use(Install);

async function start() {
  try {
    const result = await dbConn.query("select 'trident' ");
    app.listen(5000);
    console.log("database connection established");
    console.log("Server is running on port 5000");
  } catch (error) {
    console.error(error.message);
  }
}
start();
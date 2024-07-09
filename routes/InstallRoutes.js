import express from "express";
import { createTable } from "../Controllers/InstallController.js";

const router = express.Router();

router.get("/install", createTable);

export default router;

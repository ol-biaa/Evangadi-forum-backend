
import express from "express";
import { postAnswer, getAnswers } from "../Controllers/answerController.js";
import authMiddleware from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/:questionId", authMiddleware, postAnswer);
router.get("/:questionId", authMiddleware, getAnswers);

export default router;

import {
    getAllQuestions,
    getSingleQuestion,
    postQuestion,
    searchQuestions,
    favoriteQuestions,
    getFavoriteQuestions,
  } from "../Controllers/questionController.js";
  import express from "express";
  import authMiddleware from "../Middleware/authMiddleware.js";
  
  const router = express.Router();
  
  router.get("/", authMiddleware, getAllQuestions);
  router.put("/favorite/:questionId", authMiddleware, favoriteQuestions);
  router.get("/favorite", authMiddleware, getFavoriteQuestions);
  router.get("/:id", getSingleQuestion);
  router.post("/", authMiddleware, postQuestion);
  router.get("/search/:searchQuery", searchQuestions);
  
  export default router;
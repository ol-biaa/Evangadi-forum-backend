// const { response } = require("express");
import dbConn from "../DB/dbConfig.js";
import generateUniqueId from "generate-unique-id";

export const postQuestion = async (req, res) => {
  if (!req.body.title || !req.body.description) {
    return res.status(400).send("Title and description are required");
  }

  const questionid = generateUniqueId();
  let response = null;
  if (req.body.tag) {
    const [question] = await dbConn.query(
      "INSERT INTO questions (title, description, tag, userid,questionid) VALUES (?,?,?,?,?)",
      [
        req.body.title,
        req.body.description,
        req.body.tag,
        req.user.userid,
        questionid,
      ]
    );
    response = question;
  } else {
    const [question] = await dbConn.query(
      "INSERT INTO questions (title, description, userid,question_id) VALUES (?,?,?,?)",
      [req.body.title, req.body.description, req.user.userid, questionid]
    );
    response = question;
  }

  if (response?.length === 0) {
    return res.status(500).send("Failed to post question");
  }

  res.status(201).send("Question posted");
};

export const getAllQuestions = async (req, res) => {
  try {
    const [questions] = await dbConn.query(
      "SELECT t1.*, t2.username FROM questions t1 LEFT JOIN users t2 ON t1.userid = t2.userid"
    );

    const promises = questions.map(async (question) => {
      const favoriteQuery = `
        SELECT COUNT(*) AS is_favorite
        FROM favorites
        WHERE question_id = ? AND user_id = ?;
      `;
      const [favorites] = await dbConn.query(favoriteQuery, [
        question.id,
        req.user.userid,
      ]);

      question.is_favorite = favorites[0].is_favorite === 1;
      return question;
    });

    const questionsWithFavoriteStatus = await Promise.all(promises);
    res.send(questionsWithFavoriteStatus);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch questions");
  }
};

export const getSingleQuestion = async (req, res) => {
  const [question] = await dbConn.query(
    "SELECT * FROM questions WHERE id = ?",
    [req.params.id]
  );

  if (question.length === 0) {
    return res.status(404).send("Question not found");
  }

  res.status(200).send(question);
};

export const searchQuestions = async (req, res) => {
  const { searchQuery } = req.query;

  const [questions] = await dbConn.query(
    "SELECT t1.*, t2.username FROM questions t1 LEFT JOIN users t2 ON t1.userid = t2.userid WHERE title LIKE ?",
    [`%${req.params.searchQuery}%`]
  );

  res.status(200).send(questions);
};

export const favoriteQuestions = async (req, res) => {
  const { questionId } = req.params;

  try {
    const [question] = await dbConn.query(
      "SELECT * FROM questions WHERE id = ?",
      [questionId]
    );

    if (question.length === 0) {
      return res.status(404).json({ message: "Question not found" });
    }

    const [favorite] = await dbConn.query(
      "SELECT * FROM favorites WHERE question_id = ? AND user_id = ?",
      [questionId, req.user.userid]
    );

    if (favorite.length > 0) {
      await dbConn.query(
        "DELETE FROM favorites WHERE question_id = ? AND user_id = ?",
        [questionId, req.user.userid]
      );

      return res
        .status(200)
        .json({ message: "Question removed from favorites" });
    }

    await dbConn.query(
      "INSERT INTO favorites (question_id, user_id) VALUES (?, ?)",
      [questionId, req.user.userid]
    );

    return res.status(200).json({ message: "Question added to favorites" });
  } catch (error) {
    console.error("Favorite question controller error: ", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getFavoriteQuestions = async (req, res) => {
  // const [favoriteQuestions] = await dbConn.query(
  //   "SELECT * FROM questions INNER JOIN favorites ON questions.id = favorites.question_id WHERE favorites.user_id = ?",
  //   [req.user.userid]
  // );

  const [favoriteQuestions] = await dbConn.query(
    "SELECT t1.*, t2.username FROM questions t1 LEFT JOIN users t2 ON t1.userid = t2.userid WHERE id IN (SELECT question_id FROM favorites WHERE user_id = ?)",
    [req.user.userid]
  );

  res.status(200).send(favoriteQuestions);
};
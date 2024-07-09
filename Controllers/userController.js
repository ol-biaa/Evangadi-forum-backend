import dbConn from "../DB/dbConfig.js";
import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
// import google from "googleapis";


var transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
 auth: {
    user: process.env.MYEMAIL_USERNAME,
    pass: process.env.MYEMAIL_PASSWORD,
  },
});
async function register(req, res) {
  const { username, firstname, lastname, email, password } = req.body;
  if (!email || !password || !firstname || !lastname || !username) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide all required information" });
  }

  try {
    const [user] = await dbConn.query(
      "SELECT username, userid FROM users where username= ? or email = ?",
      [username, email]
    );
    console.log(user);

    if (user.length > 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "user already registered" });
    }

    if (password.length <= 8) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "password must be at least 8 charcters" });
    }
    // encrypt the password
    const salt = await bcrypt.genSalt();
    const hashedpassword = await bcrypt.hash(password, salt);

    await dbConn.query(
      "INSERT INTO users (username, firstname, lastname, email, password) VALUES (?,?,?,?,?)",
      [username, firstname, lastname, email, hashedpassword]
    );

    return res
      .status(StatusCodes.CREATED)
      .json({ msg: "user registered successfully" });
  } catch (err) {
    console.log(err.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Something went wrong. please try later" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  console.log({ email, password });

  if (!email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please enter all required fields" });
  }
  try {
    const [user] = await dbConn.query(
      "SELECT username, userid, firstname, lastname, password FROM users where email = ?",
      [email]
    );

    if (user.length == 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Invalid credential" });
    }

    //Verify password
    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Incorrect password" });
    }

    const username = user[0].username;
    const userid = user[0].userid;
    const firstname = user[0].firstname;
    const lastname = user[0].lastname;
    const accessToken = jwt.sign(
      { username, userid, firstname, lastname },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    return res.status(StatusCodes.OK).json({
      msg: "user login successful",
      accessToken,
      username,
      firstname,
      lastname,
    });
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Something went wrong. please try later" });
  }
}

async function checkUser(req, res) {
  console.log(req);
  const username = req.user.username;
  const userid = req.user.userid;
  const firstname = req.user.firstname;
  const lastname = req.user.lastname;
  return res
    .status(StatusCodes.OK)
    .json({ msg: "valid user", username, userid, firstname, lastname });
}

async function getUsername(req, res) {
  const { userid } = req.query;
  if (!userid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide userid" });
  }

  try {
    const [username] = await dbConn.query(
      "SELECT u.username FROM users u JOIN answers o ON u.userid = o.userid WHERE o.userid = (?)",
      userid
    );
    return res.status(StatusCodes.OK).json(username);
  } catch (err) {
    console.log(err.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Something went wrong. please try later" });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  const resetTokens = {};
  console.log("req.body:", req.body);
  console.log("email:", email);

  if (!email) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide your email" });
  }
  try {
    const [user] = await dbConn.query(
      "SELECT username FROM users where email = ?",
      email
    );

    if (user.length == 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "user is not registered" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const rtExpiryDate = Date.now() + 600000;

    console.log("resetToken", resetToken);
    console.log("rtExpiryDate", rtExpiryDate);

    await dbConn.query("UPDATE users SET resetToken = ? where email = ?", [
      resetToken,
      email,
    ]);

    // Define email content
    const mailOptions = {
      from: "api@demomailtrap.com",
      to: email,
      subject: "Password Reset request",
      text:
        `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
        `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
        `http://localhost:5173/reset/${resetToken}\n\n` +
        `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };
    // Send email
    transporter.sendMail(mailOptions, (err, info) => {
      console.log("Email sent successfully!");
      return res.status(StatusCodes.OK).json(info);
    });
  } catch (err) {
    console.log(err.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Something went wrong. please try later" });
  }
}

async function resetPassword(req, res) {
  const { resetToken, newPassword } = req.body;
  console.log("req.body:", req.body);
  console.log(newPassword);

  //check new password satisifies length criteria
  if (newPassword.length <= 8) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "password must be at least 8 charcters" });
  }

  try {
    //Check user exists using the resetToken
    const [ruser] = await dbConn.query(
      "SELECT username FROM users where resetToken = ?",
      resetToken
    );

    console.log("ruser:", ruser);

    if (ruser.length == 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "user is not registered" });
    }

    const rusername = ruser[0].username;
    console.log("rusername:", rusername);

    // encrypt the password
    const salt = await bcrypt.genSalt();
    const hashednewPassword = await bcrypt.hash(newPassword, salt);

    //updade the password to new. Reset the token to Null
    await dbConn.query(
      "UPDATE users SET password = ?, resetToken = ? where username = ?",
      [hashednewPassword, null, rusername]
    );

    return res
      .status(StatusCodes.CREATED)
      .json({ msg: "password reset successfully" });
  } catch (err) {
    console.log(err.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Something went wrong. please try later" });
  }
}

export {
  register,
  login,
  checkUser,
  getUsername,
  forgotPassword,
  resetPassword,
};
import jwt from "jsonwebtoken";

function authMiddleware(req, res, next) {
 
  const authHeader = req.headers.authorization;
  //console.log(authHeader)
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ message: "Authentication invalid" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const { username, userid } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { username, userid };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication invalid" });
    
  }
  //   res.redirect("/login");
}

export default authMiddleware;
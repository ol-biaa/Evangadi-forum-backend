import dbConn from "../DB/dbConfig.js";


export const createTable = async (req, res) => {
  try {
    await dbConn.query(
      `CREATE TABLE users(
	userid INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(20) NOT NULL,
    firstname VARCHAR(20) NOT NULL,
    lastname VARCHAR(20) NOT NULL,
    email VARCHAR(40) NOT NULL,
    password VARCHAR(100) NOT NULL,
    resetToken VARCHAR(100), 
    PRIMARY KEY(userid)
);`
    );
    await dbConn.query(
      `CREATE TABLE questions(
id INT NOT NULL AUTO_INCREMENT,
    question_id VARCHAR(100) NOT NULL UNIQUE,
    userid INT NOT NULL,
    title VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    tag VARCHAR(20),
    PRIMARY KEY (id, question_id),
    FOREIGN KEY (userid) REFERENCES users(userid)
);`
    );
    await dbConn.query(
      `CREATE TABLE answers(
    answerid INT NOT NULL auto_increment,
    userid INT NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    answer VARCHAR(200) NOT NULL,
    PRIMARY KEY	(answerid),
    FOREIGN KEY (question_id) REFERENCES questions( question_id),
    FOREIGN KEY (userid) REFERENCES users(userid)
);`
    );
    await dbConn.query(
      `CREATE TABLE favorites(
    user_id INT NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    PRIMARY KEY	(question_id, user_id),
    FOREIGN KEY (question_id) REFERENCES questions(question_id),
    FOREIGN KEY (user_id) REFERENCES users(userid)
);`
    );
    res.end("Tables are created");
  }catch (error) {
    console.log(error);
  }
};

const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Register API
app.post("/register/", async (request, response) => {
  const userDetails = request.body;
  const { username, name, password, gender, location } = userDetails;
  const hashedPassword = await bcrypt.hash(password, 10);

  const isUserExitQuery = `SELECT * FROM user WHERE username ='${username}';`;
  const dbUser = await db.get(isUserExitQuery);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createNewUserQuery = `INSERT INTO user (username,name,password,gender,location) 
    values ("${username}","${name}","${hashedPassword}","${gender}","${location}");`;
      const dbResponse = await db.run(createNewUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

// LogIn API
app.post("/login", async (request, response) => {
  const userLogInDetails = request.body;
  const { username, password } = userLogInDetails;

  const isUserExists = `SELECT * FROM user WHERE username = "${username}";`;
  const dbUser = await db.get(isUserExists);
  console.log(dbUser);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordSame = await bcrypt.compare(password, dbUser.password);
    if (isPasswordSame !== true) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  }
});

// Change password Api
app.put("/change-password/", async (request, response) => {
  const changePassword = request.body;
  const { username, oldPassword, newPassword } = changePassword;
  const query = `select * from user where username="${username}"`;
  const dbUser = await db.get(query);

  const isMatched = await bcrypt.compare(oldPassword, dbUser.password);

  if (isMatched === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedNewPassword = await bcrypt.hash(newPassword, 15);
      const updatePasswordQuery = `UPDATE user SET password = "${hashedNewPassword}" WHERE username = "${username}"`;
      const dbResponse = await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  }
});

module.exports = app;

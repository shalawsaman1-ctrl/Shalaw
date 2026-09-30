const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DB = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(__dirname));

function readDB() {
  if (!fs.existsSync(DB)) {
    fs.writeFileSync(
      DB,
      JSON.stringify(
        { users: [], questions: [], answers: [] },
        null,
        2
      )
    );
  }

  return JSON.parse(fs.readFileSync(DB, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Get all data
app.get("/api/data", (req, res) => {
  res.json(readDB());
});

// Create account
app.post("/api/signup", (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      error: "name and email required"
    });
  }

  const db = readDB();

  if (db.users.some(user => user.email === email)) {
    return res.status(409).json({
      error: "email already exists"
    });
  }

  const user = {
    id: Date.now().toString(),
    name,
    email,
    points: 0
  };

  db.users.push(user);
  writeDB(db);

  res.json(user);
});

// Create question
app.post("/api/questions", (req, res) => {
  const { userId, text } = req.body;

  if (!userId || !text) {
    return res.status(400).json({
      error: "missing data"
    });
  }

  const db = readDB();

  const question = {
    id: Date.now().toString(),
    userId,
    text,
    likes: 0,
    createdAt: new Date().toISOString()
  };

  db.questions.unshift(question);
  writeDB(db);

  res.json(question);
});

// Like question
app.post("/api/questions/:id/like", (req, res) => {
  const db = readDB();

  const question = db.questions.find(
    q => q.id === req.params.id
  );

  if (!question) {
    return res.sendStatus(404);
  }

  question.likes++;
  writeDB(db);

  res.json(question);
});

// Answer question
app.post("/api/questions/:id/answers", (req, res) => {
  const { userId, text } = req.body;

  if (!userId || !text) {
    return res.status(400).json({
      error: "missing data"
    });
  }

  const db = readDB();

  const answer = {
    id: Date.now().toString(),
    questionId: req.params.id,
    userId,
    text,
    createdAt: new Date().toISOString()
  };

  db.answers.push(answer);
  writeDB(db);

  res.json(answer);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("SHALAW running on port " + PORT);
});

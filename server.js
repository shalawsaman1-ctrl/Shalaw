const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "data.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialDB = {
      users: [],
      questions: [],
      answers: [],
      physicsResults: []
    };

    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(initialDB, null, 2)
    );
  }

  try {
    return JSON.parse(
      fs.readFileSync(DB_FILE, "utf8")
    );
  } catch {
    return {
      users: [],
      questions: [],
      answers: [],
      physicsResults: []
    };
  }
}

function writeDB(db) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(db, null, 2)
  );
}

const sessions = new Map();

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api/", apiLimiter);

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");

  sessions.set(token, {
    userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });

  return token;
}

function getSessionUser(req) {
  const auth = req.headers.authorization || "";

  if (!auth.startsWith("Bearer ")) {
    return null;
  }

  const token = auth.slice(7);
  const session = sessions.get(token);

  if (!session) {
    return null;
  }

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  const db = readDB();

  return (
    db.users.find(
      user => user.id === session.userId
    ) || null
  );
}

function requireAuth(req, res, next) {
  const user = getSessionUser(req);

  if (!user) {
    return res.status(401).json({
      error: "تکایە سەرەتا Login بکە."
    });
  }

  req.user = user;
  next();
}

/* =========================
   SIGNUP
========================= */

app.post("/api/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      password
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "تکایە هەموو خانەکان پڕ بکەرەوە."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت."
      });
    }

    const db = readDB();

    const normalizedEmail =
      String(email).trim().toLowerCase();

    const exists = db.users.find(
      user => user.email === normalizedEmail
    );

    if (exists) {
      return res.status(409).json({
        error: "ئەم ئیمەیڵە پێشتر بەکارهاتووە."
      });
    }

    const passwordHash =
      await bcrypt.hash(password, 10);

    const user = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      xp: 0,
      level: 1,
      createdAt: new Date().toISOString()
    };

    db.users.push(user);

    writeDB(db);

    const token = createSession(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level
      },
      token
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "هەڵەیەکی سێرڤەر ڕوویدا."
    });
  }
});

/* =========================
   LOGIN
========================= */

app.post("/api/login", async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email و Password پڕ بکەرەوە."
      });
    }

    const db = readDB();

    const normalizedEmail =
      String(email).trim().toLowerCase();

    const user = db.users.find(
      u => u.email === normalizedEmail
    );

    if (!user) {
      return res.status(401).json({
        error: "Email یان Password هەڵەیە."
      });
    }

    const valid =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!valid) {
      return res.status(401).json({
        error: "Email یان Password هەڵەیە."
      });
    }

    const token =
      createSession(user.id);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        xp: user.xp || 0,
        level: user.level || 1
      },
      token
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "هەڵەیەکی سێرڤەر ڕوویدا."
    });
  }
});

/* =========================
   LOGOUT
========================= */

app.post("/api/logout", (req, res) => {
  const auth = req.headers.authorization || "";

  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    sessions.delete(token);
  }

  res.json({
    success: true
  });
});

/* =========================
   CURRENT USER
========================= */

app.get("/api/me", requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      xp: req.user.xp || 0,
      level: req.user.level || 1
    }
  });
});

/* =========================
   GET QUESTIONS
========================= */

app.get("/api/questions", (req, res) => {
  const db = readDB();

  const questions = db.questions
    .slice()
    .reverse()
    .map(q => {
      const user =
        db.users.find(
          u => u.id === q.userId
        );

      const answersCount =
        db.answers.filter(
          a => a.questionId === q.id
        ).length;

      return {
        id: q.id,
        text: q.text,
        likes: q.likes || 0,
        answersCount,
        createdAt: q.createdAt,
        user: {
          id: user?.id,
          name: user?.name || "Member"
        }
      };
    });

  res.json(questions);
});

/* =========================
   CREATE QUESTION
========================= */

app.post(
  "/api/questions",
  requireAuth,
  (req, res) => {
    try {
      const { text } = req.body;

      if (!text || !String(text).trim()) {
        return res.status(400).json({
          error: "پرسیارەکەت بنووسە."
        });
      }

      const db = readDB();

      const question = {
        id: crypto.randomUUID(),
        userId: req.user.id,
        text: String(text).trim(),
        likes: 0,
        createdAt: new Date().toISOString()
      };

      db.questions.push(question);

      const user =
        db.users.find(
          u => u.id === req.user.id
        );

      if (user) {
        user.xp = (user.xp || 0) + 10;
        user.level =
          Math.floor(user.xp / 100) + 1;
      }

      writeDB(db);

      res.status(201).json({
        question
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "هەڵەیەکی سێرڤەر ڕوویدا."
      });
    }
  }
);

/* =========================
   LIKE QUESTION
========================= */

app.post(
  "/api/questions/:id/like",
  requireAuth,
  (req, res) => {
    const db = readDB();

    const question =
      db.questions.find(
        q => q.id === req.params.id
      );

    if (!question) {
      return res.status(404).json({
        error: "پرسیار نەدۆزرایەوە."
      });
    }

    question.likes =
      (question.likes || 0) + 1;

    writeDB(db);

    res.json({
      likes: question.likes
    });
  }
);

/* =========================
   PHYSICS RESULT
========================= */

app.post(
  "/api/physics/result",
  requireAuth,
  (req, res) => {
    try {
      const {
        score,
        total
      } = req.body;

      const db = readDB();

      const result = {
        id: crypto.randomUUID(),
        userId: req.user.id,
        score: Number(score) || 0,
        total: Number(total) || 0,
        createdAt: new Date().toISOString()
      };

      db.physicsResults.push(result);

      const user =
        db.users.find(
          u => u.id === req.user.id
        );

      if (user) {
        user.xp =
          (user.xp || 0) +
          result.score * 10;

        user.level =
          Math.floor(user.xp / 100) + 1;
      }

      writeDB(db);

      res.json({
        success: true,
        result
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "هەڵەیەکی سێرڤەر ڕوویدا."
      });
    }
  }
);

/* =========================
   HEALTH CHECK
========================= */

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "SHALAW"
  });
});

/* =========================
   SERVE WEBSITE
========================= */

app.use(
  express.static(__dirname)
);

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, HOST, () => {
  console.log(
    `SHALAW server running on ${HOST}:${PORT}`
  );
});

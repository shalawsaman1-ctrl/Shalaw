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
    const db = {
      users: [],
      questions: []
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return db;
  }

  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return {
      users: [],
      questions: []
    };
  }
}

function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

const sessions = new Map();

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(express.json({ limit: "100kb" }));

app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200
  })
);

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");

  sessions.set(token, {
    userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });

  return token;
}

function getUser(req) {
  const auth = req.headers.authorization || "";

  if (!auth.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  const session = sessions.get(token);

  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  const db = readDB();

  return db.users.find(
    user => user.id === session.userId
  );
}

function auth(req, res, next) {
  const user = getUser(req);

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
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "تکایە هەموو خانەکان پڕ بکەرەوە."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password دەبێت لانیکەم ٦ پیت بێت."
      });
    }

    const db = readDB();

    const normalizedEmail =
      String(email).trim().toLowerCase();

    if (
      db.users.some(
        user => user.email === normalizedEmail
      )
    ) {
      return res.status(409).json({
        error: "ئەم Email ـە پێشتر بەکارهاتووە."
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
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "هەڵەی سێرڤەر."
    });
  }
});

/* =========================
   LOGIN
========================= */

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const db = readDB();

    const normalizedEmail =
      String(email || "").trim().toLowerCase();

    const user = db.users.find(
      u => u.email === normalizedEmail
    );

    if (!user) {
      return res.status(401).json({
        error: "Email یان Password هەڵەیە."
      });
    }

    const valid = await bcrypt.compare(
      password || "",
      user.passwordHash
    );

    if (!valid) {
      return res.status(401).json({
        error: "Email یان Password هەڵەیە."
      });
    }

    const token = createSession(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        xp: user.xp || 0,
        level: user.level || 1
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "هەڵەی سێرڤەر."
    });
  }
});

/* =========================
   ME
========================= */

app.get("/api/me", auth, (req, res) => {
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
   QUESTIONS
========================= */

app.get("/api/questions", (req, res) => {
  const db = readDB();

  const questions = db.questions
    .slice()
    .reverse()
    .map(q => {
      const user = db.users.find(
        u => u.id === q.userId
      );

      return {
        id: q.id,
        text: q.text,
        likes: q.likes || 0,
        answersCount: q.answersCount || 0,
        createdAt: q.createdAt,
        user: {
          name: user?.name || "Member"
        }
      };
    });

  res.json(questions);
});

app.post("/api/questions", auth, (req, res) => {
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
    answersCount: 0,
    createdAt: new Date().toISOString()
  };

  db.questions.push(question);

  const user = db.users.find(
    u => u.id === req.user.id
  );

  if (user) {
    user.xp = (user.xp || 0) + 10;
    user.level = Math.floor(user.xp / 100) + 1;
  }

  writeDB(db);

  res.status(201).json({
    question
  });
});

/* =========================
   LIKE
========================= */

app.post(
  "/api/questions/:id/like",
  auth,
  (req, res) => {
    const db = readDB();

    const question = db.questions.find(
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
   HTML WEBSITE
========================= */

const HTML = `<!DOCTYPE html>
<html lang="ku">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SHALAW — Community</title>

<style>
*{
  box-sizing:border-box;
  margin:0;
  padding:0;
  font-family:Arial,Helvetica,sans-serif;
}

body{
  background:#08090d;
  color:white;
  min-height:100vh;
}

nav{
  height:72px;
  padding:0 7%;
  display:flex;
  align-items:center;
  justify-content:space-between;
  border-bottom:1px solid #242630;
  background:#08090de6;
  position:sticky;
  top:0;
  z-index:10;
}

.logo{
  font-size:25px;
  font-weight:900;
  letter-spacing:2px;
  background:linear-gradient(90deg,#8b5cf6,#ec4899);
  -webkit-background-clip:text;
  color:transparent;
}

nav a{
  color:#aaa;
  text-decoration:none;
  margin:0 10px;
}

button{
  border:0;
  cursor:pointer;
}

.login{
  background:linear-gradient(135deg,#7c3aed,#db2777);
  color:white;
  padding:11px 20px;
  border-radius:12px;
}

.hero{
  min-height:580px;
  padding:80px 7%;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:50px;
}

.hero-text{
  max-width:650px;
}

.badge{
  display:inline-block;
  padding:9px 15px;
  border-radius:30px;
  color:#c4b5fd;
  background:#8b5cf61a;
  border:1px solid #8b5cf655;
  margin-bottom:22px;
}

h1{
  font-size:clamp(48px,7vw,82px);
  line-height:.95;
  margin-bottom:25px;
}

.gradient{
  background:linear-gradient(90deg,#a78bfa,#f472b6);
  -webkit-background-clip:text;
  color:transparent;
}

.hero p{
  color:#aaa;
  font-size:18px;
  line-height:1.8;
  margin-bottom:30px;
}

.primary,.secondary{
  padding:15px 24px;
  border-radius:14px;
  font-weight:bold;
  margin-right:8px;
}

.primary{
  color:white;
  background:linear-gradient(135deg,#7c3aed,#db2777);
}

.secondary{
  color:white;
  background:#14151c;
  border:1px solid #292b35;
}

.card{
  width:380px;
  background:linear-gradient(145deg,#171821,#0e0f15);
  border:1px solid #282936;
  border-radius:28px;
  padding:28px;
}

.avatar{
  width:75px;
  height:75px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:22px;
  background:linear-gradient(135deg,#7c3aed,#ec4899);
  font-size:30px;
  font-weight:bold;
  margin-bottom:18px;
}

.level{
  margin-top:25px;
  padding:18px;
  background:#0a0b10;
  border-radius:18px;
}

.bar{
  height:9px;
  background:#242630;
  border-radius:20px;
  overflow:hidden;
  margin-top:10px;
}

.bar div{
  width:72%;
  height:100%;
  background:linear-gradient(90deg,#7c3aed,#ec4899);
}

.container{
  width:86%;
  max-width:1250px;
  margin:auto;
  padding-bottom:80px;
}

.title{
  margin:35px 0 20px;
  font-size:28px;
}

.stats{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:15px;
}

.stat,.question,.action,.leaderboard{
  background:#111219;
  border:1px solid #242630;
  border-radius:20px;
}

.stat{
  padding:23px;
}

.stat span{
  color:#888;
  font-size:13px;
}

.stat strong{
  display:block;
  font-size:30px;
  margin-top:8px;
}

.actions{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:15px;
}

.action{
  padding:25px;
  transition:.2s;
}

.action:hover{
  transform:translateY(-4px);
  border-color:#7c3aed;
}

.action-icon{
  font-size:30px;
  margin-bottom:15px;
}

.action p{
  color:#888;
  margin-top:8px;
}

.question{
  padding:22px;
  margin-bottom:14px;
}

.question-user{
  color:#a78bfa;
  font-weight:bold;
  margin-bottom:12px;
}

.question p{
  color:#ddd;
  line-height:1.7;
  margin-bottom:18px;
}

.small{
  background:#1b1c25;
  color:#aaa;
  padding:9px 14px;
  border-radius:10px;
  margin-right:6px;
}

.player{
  padding:18px 22px;
  display:flex;
  justify-content:space-between;
  border-bottom:1px solid #20212a;
}

.xp{
  color:#a78bfa;
  font-weight:bold;
}

footer{
  text-align:center;
  padding:35px;
  color:#777;
  border-top:1px solid #20212a;
}

.modal{
  display:none;
  position:fixed;
  inset:0;
  background:#000b;
  z-index:100;
  align-items:center;
  justify-content:center;
  padding:20px;
}

.box{
  width:100%;
  max-width:430px;
  background:#111219;
  border:1px solid #292b36;
  border-radius:25px;
  padding:28px;
}

.box h2{
  margin-bottom:20px;
}

input,textarea{
  width:100%;
  padding:14px;
  margin-bottom:12px;
  background:#08090d;
  color:white;
  border:1px solid #292b36;
  border-radius:12px;
  outline:none;
}

textarea{
  min-height:130px;
}

.form{
  width:100%;
  padding:14px;
  border-radius:12px;
  color:white;
  background:linear-gradient(135deg,#7c3aed,#db2777);
  font-weight:bold;
}

.close{
  float:right;
  color:#888;
  background:transparent;
  font-size:25px;
}

@media(max-width:900px){
  .hero{
    flex-direction:column;
    text-align:center;
  }

  .card{
    width:100%;
    max-width:430px;
  }

  .stats{
    grid-template-columns:1fr 1fr;
  }

  .actions{
    grid-template-columns:1fr;
  }

  nav div:nth-child(2){
    display:none;
  }
}
</style>
</head>

<body>

<nav>
  <div class="logo">SHALAW</div>

  <div>
    <a href="#home">Home</a>
    <a href="#community">Community</a>
    <a href="#leaderboard">Leaderboard</a>
  </div>

  <button class="login" onclick="openLogin()">Login</button>
</nav>

<section class="hero" id="home">

  <div class="hero-text">

    <div class="badge">✦ Welcome to SHALAW</div>

    <h1>
      Your place.<br>
      Your <span class="gradient">community.</span>
    </h1>

    <p>
      SHALAW ـە شوێنێکی نوێ بۆ پرسیارکردن،
      فێربوون، هاوبەشکردنی بیرۆکە و پەیوەندی
      لەگەڵ کۆمەڵگە.
    </p>

    <button class="primary" onclick="openSignup()">
      دروستکردنی ئەکاونت
    </button>

    <button class="secondary" onclick="openQuestion()">
      + پرسیارێک بکە
    </button>

  </div>

  <div class="card">

    <div class="avatar">S</div>

    <h2>SHALAW User</h2>

    <p style="color:#888;margin-top:7px">
      Community Member
    </p>

    <div class="level">
      <div style="display:flex;justify-content:space-between;color:#aaa">
        <span>Level 12</span>
        <span>7,240 XP</span>
      </div>

      <div class="bar">
        <div></div>
      </div>
    </div>

  </div>

</section>

<main class="container">

<h2 class="title">Overview</h2>

<div class="stats">

<div class="stat">
<span>Members</span>
<strong>12.8K</strong>
</div>

<div class="stat">
<span>Questions</span>
<strong>4.6K</strong>
</div>

<div class="stat">
<span>Answers</span>
<strong>18K</strong>
</div>

<div class="stat">
<span>Online</span>
<strong>342</strong>
</div>

</div>

<h2 class="title">Quick Actions</h2>

<div class="actions">

<div class="action" onclick="openQuestion()">
<div class="action-icon">💬</div>
<h3>Ask a Question</h3>
<p>پرسیارێکت هەیە؟ لە کۆمەڵگەکە بپرسە.</p>
</div>

<div class="action">
<div class="action-icon">⚡</div>
<h3>Physics Challenge</h3>
<p>خۆت لە تاقیکردنەوەی فیزیا تاقی بکەرەوە.</p>
</div>

<div class="action">
<div class="action-icon">🏆</div>
<h3>Leaderboard</h3>
<p>شوێنی خۆت ببینە.</p>
</div>

</div>

<h2 class="title" id="community">
Community Questions
</h2>

<div id="questions"></div>

<h2 class="title" id="leaderboard">
🏆 Leaderboard
</h2>

<div class="leaderboard">

<div class="player">
<strong>🥇 Shalaw</strong>
<span class="xp">9,820 XP</span>
</div>

<div class="player">
<strong>🥈 Member Two</strong>
<span class="xp">8,540 XP</span>
</div>

<div class="player">
<strong>🥉 Member Three</strong>
<span class="xp">7,920 XP</span>
</div>

</div>

</main>

<footer>
© 2026 SHALAW — Built for the community.
</footer>

<div class="modal" id="loginModal">

<div class="box">

<button class="close" onclick="closeModal('loginModal')">
×
</button>

<h2>Login</h2>

<input id="loginEmail" type="email" placeholder="Email">

<input id="loginPassword" type="password" placeholder="Password">

<button class="form" onclick="login()">
Login
</button>

</div>

</div>

<div class="modal" id="signupModal">

<div class="box">

<button class="close" onclick="closeModal('signupModal')">
×
</button>

<h2>Create Account</h2>

<input id="signupName" placeholder="Name">

<input id="signupEmail" type="email" placeholder="Email">

<input id="signupPassword" type="password" placeholder="Password">

<button class="form" onclick="signup()">
Create Account
</button>

</div>

</div>

<div class="modal" id="questionModal">

<div class="box">

<button class="close" onclick="closeModal('questionModal')">
×
</button>

<h2>Ask a Question</h2>

<textarea id="questionText"
placeholder="پرسیارەکەت لێرە بنووسە..."></textarea>

<button class="form" onclick="sendQuestion()">
Publish Question
</button>

</div>

</div>

<script>

function openLogin(){
  document.getElementById("loginModal").style.display="flex";
}

function openSignup(){
  document.getElementById("signupModal").style.display="flex";
}

function openQuestion(){
  document.getElementById("questionModal").style.display="flex";
}

function closeModal(id){
  document.getElementById(id).style.display="none";
}

async function login(){

  const email =
    document.getElementById("loginEmail").value;

  const password =
    document.getElementById("loginPassword").value;

  const response =
    await fetch("/api/login",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        email,
        password
      })
    });

  const data = await response.json();

  if(!response.ok){
    alert(data.error || "Login failed");
    return;
  }

  localStorage.setItem("token",data.token);

  alert("بە سەرکەوتوویی چوویتە ژوورەوە ✅");

  closeModal("loginModal");
}

async function signup(){

  const name =
    document.getElementById("signupName").value;

  const email =
    document.getElementById("signupEmail").value;

  const password =
    document.getElementById("signupPassword").value;

  const response =
    await fetch("/api/signup",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        name,
        email,
        password
      })
    });

  const data = await response.json();

  if(!response.ok){
    alert(data.error || "Signup failed");
    return;
  }

  localStorage.setItem("token",data.token);

  alert("ئەکاونتەکەت دروستکرا ✅");

  closeModal("signupModal");
}

async function sendQuestion(){

  const text =
    document.getElementById("questionText").value;

  const token =
    localStorage.getItem("token");

  if(!token){
    alert("تکایە سەرەتا Login بکە.");
    closeModal("questionModal");
    openLogin();
    return;
  }

  const response =
    await fetch("/api/questions",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+token
      },
      body:JSON.stringify({text})
    });

  const data = await response.json();

  if(!response.ok){
    alert(data.error || "Failed");
    return;
  }

  alert("پرسیارەکەت بڵاوکرایەوە ✅");

  document.getElementById("questionText").value="";

  closeModal("questionModal");

  loadQuestions();
}

async function loadQuestions(){

  const response =
    await fetch("/api/questions");

  if(!response.ok)return;

  const questions =
    await response.json();

  const container =
    document.getElementById("questions");

  container.innerHTML="";

  questions.forEach(q=>{

    const div =
      document.createElement("div");

    div.className="question";

    div.innerHTML=`
      <div class="question-user">
        👤 ${escapeHTML(q.user?.name || "Member")}
      </div>

      <p>${escapeHTML(q.text || "")}</p>

      <button class="small">
        ❤️ ${q.likes || 0}
      </button>

      <button class="small">
        💬 ${q.answersCount || 0}
      </button>
    `;

    container.appendChild(div);
  });
}

function escapeHTML(text){

  const div =
    document.createElement("div");

  div.textContent=text;

  return div.innerHTML;
}

loadQuestions();

</script>

</body>
</html>`;

app.get("/", (req, res) => {
  res.type("html").send(HTML);
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "SHALAW"
  });
});

app.listen(PORT, HOST, () => {
  console.log(
    `SHALAW running on ${HOST}:${PORT}`
  );
});

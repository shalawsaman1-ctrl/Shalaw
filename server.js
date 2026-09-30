const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(express.json({ limit: "20kb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "data.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function emptyDB() {
  return {
    users: [],
    questions: [],
    answers: []
  };
}

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const db = emptyDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return db;
  }

  try {
    return JSON.parse(
      fs.readFileSync(DB_FILE, "utf8")
    );
  } catch {
    return emptyDB();
  }
}

function writeDB(db) {
  const temp = DB_FILE + ".tmp";

  fs.writeFileSync(
    temp,
    JSON.stringify(db, null, 2),
    "utf8"
  );

  fs.renameSync(temp, DB_FILE);
}

function cleanText(value, max = 1000) {
  if (typeof value !== "string") return "";

  return value
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, max);
}

function cleanEmail(value) {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .toLowerCase()
    .slice(0, 150);
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validId(id) {
  return (
    typeof id === "string" &&
    /^[a-zA-Z0-9_-]{1,120}$/.test(id)
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    points: user.points || 0,
    physicsCorrect: user.physicsCorrect || 0,
    physicsXP: user.physicsXP || 0
  };
}

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>SHALAW</title>

<style>

*{
  box-sizing:border-box;
}

body{
  margin:0;
  font-family:Arial,sans-serif;
  background:
    radial-gradient(circle at top,#28105c,#090914 55%);
  color:white;
  min-height:100vh;
}

.container{
  width:min(1100px,92%);
  margin:auto;
}

header{
  padding:22px 0;
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.logo{
  font-size:30px;
  font-weight:900;
  letter-spacing:3px;
  color:#a78bfa;
}

nav button{
  border:0;
  background:#7c3aed;
  color:white;
  padding:11px 18px;
  border-radius:12px;
  cursor:pointer;
}

.hero{
  text-align:center;
  padding:70px 10px 40px;
}

.hero h1{
  font-size:55px;
  margin:0;
}

.hero h1 span{
  color:#a78bfa;
}

.hero p{
  color:#b9b5ca;
  font-size:18px;
}

.card{
  background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.1);
  backdrop-filter:blur(15px);
  border-radius:22px;
  padding:25px;
  margin:20px 0;
  box-shadow:0 15px 50px rgba(0,0,0,.25);
}

.grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:18px;
}

.stat{
  text-align:center;
}

.stat strong{
  display:block;
  font-size:32px;
  color:#c4b5fd;
}

input,
textarea{
  width:100%;
  padding:14px;
  margin:7px 0;
  border:1px solid #3b3158;
  border-radius:12px;
  background:#11101d;
  color:white;
  outline:none;
}

textarea{
  min-height:120px;
  resize:vertical;
}

button{
  padding:12px 18px;
  border:0;
  border-radius:12px;
  background:#7c3aed;
  color:white;
  cursor:pointer;
  font-weight:bold;
}

button:hover{
  opacity:.9;
}

.danger{
  background:#dc2626;
}

.hidden{
  display:none!important;
}

.question{
  padding:20px;
  border-radius:16px;
  background:#121020;
  margin:15px 0;
}

.answer{
  background:#1b1830;
  padding:12px;
  border-radius:12px;
  margin-top:10px;
}

.physics{
  border:1px solid #7c3aed;
}

.option{
  width:100%;
  margin:7px 0;
  background:#211b38;
  text-align:right;
}

.correct{
  background:#15803d!important;
}

.wrong{
  background:#b91c1c!important;
}

.timer{
  font-size:30px;
  color:#fbbf24;
  text-align:center;
}

footer{
  text-align:center;
  padding:40px;
  color:#777;
}

</style>
</head>

<body>

<div class="container">

<header>
  <div class="logo">SHALAW</div>

  <nav>
    <button onclick="logout()"
    id="logoutBtn"
    class="hidden">
      دەرچوون
    </button>
  </nav>
</header>

<section id="auth">

<div class="hero">
  <h1>بەخێربێیت بۆ <span>SHALAW</span></h1>
  <p>
    فێربوون، پرسیارکردن و تاقیکردنەوە
  </p>
</div>

<div class="grid">

<div class="card">

<h2>دروستکردنی ئەکاونت</h2>

<input
id="signupName"
placeholder="ناو"
maxlength="50">

<input
id="signupEmail"
type="email"
placeholder="ئیمەیڵ">

<input
id="signupPassword"
type="password"
placeholder="وشەی نهێنی - لانیکەم ٨ پیت">

<button onclick="signup()">
دروستکردنی ئەکاونت
</button>

</div>

<div class="card">

<h2>چوونەژوورەوە</h2>

<input
id="loginEmail"
type="email"
placeholder="ئیمەیڵ">

<input
id="loginPassword"
type="password"
placeholder="وشەی نهێنی">

<button onclick="login()">
چوونەژوورەوە
</button>

</div>

</div>

</section>

<section id="app" class="hidden">

<div class="hero">
  <h1>سڵاو <span id="userName"></span> 👋</h1>
  <p>بەخێربێیت بۆ SHALAW</p>
</div>

<div class="grid">

<div class="card stat">
  <strong id="points">0</strong>
  خاڵ
</div>

<div class="card stat">
  <strong id="questionsCount">0</strong>
  پرسیار
</div>

<div class="card stat">
  <strong id="answersCount">0</strong>
  وەڵام
</div>

<div class="card stat">
  <strong id="physicsCount">0</strong>
  Physics
</div>

</div>

<div class="card">

<h2>👤 پڕۆفایل</h2>

<p id="rank">Newbie</p>

<div style="
background:#27223b;
border-radius:20px;
overflow:hidden;
">

<div id="xpBar"
style="
width:0%;
height:12px;
background:#8b5cf6;
">
</div>

</div>

</div>

<div class="card physics">

<h2>⚛️ Physics Challenge</h2>

<p>
٣٠ پرسیاری جیاواز، کاتی دیاریکراو و XP.
</p>

<button onclick="startPhysics()">
دەستپێکردن
</button>

</div>

<div
id="physicsBox"
class="card hidden">

<div class="timer">
⏱️ <span id="timer">30</span>
</div>

<h2 id="physicsQuestion"></h2>

<div id="physicsOptions"></div>

<p id="physicsFeedback"></p>

<button
id="nextPhysicsBtn"
onclick="nextPhysics()"
class="hidden">

پرسیاری داهاتوو

</button>

</div>

<div class="card">

<h2>❓ پرسیارێکی نوێ</h2>

<textarea
id="questionText"
maxlength="1000"
placeholder="پرسیارەکەت بنووسە...">
</textarea>

<button onclick="ask()">
ناردن
</button>

</div>

<div class="card">

<h2>💬 کۆمەڵگە</h2>

<div id="questionsList"></div>

</div>

</section>

<footer>
SHALAW © 2026
</footer>

</div>

<script>

let me =
JSON.parse(localStorage.getItem("me") || "null");

let db = {
  users:[],
  questions:[],
  answers:[]
};

let physicsQuestions = [

{
q:"یەکەی هێز چییە؟",
o:["Joule","Newton","Watt","Pascal"],
a:1
},

{
q:"خێرایی چۆن دەژمێردرێت؟",
o:["d/t","t/d","m×t","F/m"],
a:0
},

{
q:"یەکەی کار چییە؟",
o:["Newton","Joule","Watt","Volt"],
a:1
},

{
q:"جاذبەی زەوی نزیکەی چەندە؟",
o:["5.8 m/s²","9.8 m/s²","15 m/s²","20 m/s²"],
a:1
},

{
q:"یەکەی توان چییە؟",
o:["Watt","Newton","Joule","Ohm"],
a:0
},

{
q:"ئەگەر mass زیاد بێت، لە هەمان acceleration ـدا Force چی دەبێت؟",
o:["کەم دەبێت","زیاد دەبێت","ناگۆڕێت","صفر دەبێت"],
a:1
},

{
q:"Newton's First Law بە چی ناسراوە؟",
o:["Inertia","Gravity","Energy","Pressure"],
a:0
},

{
q:"یەکەی فشار چییە؟",
o:["Pascal","Joule","Newton","Watt"],
a:0
},

{
q:"Light لە vacuum ـدا چەند خێرایی هەیە؟",
o:["3×10⁸ m/s","3×10⁶ m/s","3×10⁵ m/s","3×10⁴ m/s"],
a:0
},

{
q:"Energy چییە؟",
o:["توانای کردنی کار","جۆری فشار","خێرایی","Mass"],
a:0
},

{
q:"Momentum بە چی یەکسانە؟",
o:["mv","ma","F/t","m/a"],
a:0
},

{
q:"یەکەی electric current چییە؟",
o:["Volt","Ampere","Ohm","Watt"],
a:1
},

{
q:"Voltage بە چی پەیوەندی هەیە؟",
o:["Potential difference","Mass","Speed","Pressure"],
a:0
},

{
q:"Ohm's Law چییە؟",
o:["V=IR","F=ma","P=mv","E=mc"],
a:0
},

{
q:"لە series circuit ـدا current چۆنە؟",
o:["لە هەموو شوێنێک یەکسانە","هەمیشە صفرە","تەنها یەک شوێنە","دەگۆڕێت"],
a:0
},

{
q:"لە vacuum ـدا گرانشی هەموو جەستەکان چۆن کاریان لەسەر دەکات؟",
o:["بە جۆری mass جیاوازە","هەمان acceleration","تەنها لەسەر گەورەکان","هیچ"],
a:1
},

{
q:"Temperature ـی absolute بە چی دەست پێدەکات؟",
o:["Kelvin","Celsius","Fahrenheit","Joule"],
a:0
},

{
q:"Sound پێویستی بە چی هەیە؟",
o:["Medium","Vacuum","Light","Gravity"],
a:0
},

{
q:"Frequency بە چی پێوانە دەکرێت؟",
o:["Hz","Watt","Volt","Newton"],
a:0
},

{
q:"Wavelength چییە؟",
o:["دووری نێوان دوو peak ـی یەک لە دوای یەک","خێرایی","Mass","توان"],
a:0
},

{
q:"Acceleration چییە؟",
o:["گۆڕانی velocity لە کاتدا","Mass","Force","Energy"],
a:0
},

{
q:"Newton's Second Law چییە؟",
o:["F=ma","V=IR","E=mc²","P=mv"],
a:0
},

{
q:"Potential Energy لە gravity ـدا بە چی پەیوەندیدارە؟",
o:["mgh","mv","IR","ma"],
a:0
},

{
q:"Kinetic Energy بە چی پەیوەندیدارە؟",
o:["½mv²","mgh","IR","F/t"],
a:0
},

{
q:"یەکەی resistance چییە؟",
o:["Ohm","Volt","Ampere","Watt"],
a:0
},

{
q:"Magnetic field ـی ئەرزی چی دەکات؟",
o:["پاراستنی زەوی لە بەشێک لە particle ـە خۆرەکییەکان","زیادکردنی mass","دروستکردنی oxygen","هیچ"],
a:0
},

{
q:"Refraction چییە؟",
o:["گۆڕانی ئاراستەی موج لە کاتی چوونە ناو medium ـێکی تر","تێکچوونی atom","زیادبوونی mass","گۆڕانی gravity"],
a:0
},

{
q:"لە Newton ـدا Force بە چی پێوانە دەکرێت؟",
o:["N","J","W","Pa"],
a:0
},

{
q:"Density بە چی یەکسانە؟",
o:["m/V","V/m","F/a","m×V"],
a:0
},

{
q:"ئەگەر velocity دوو هێندە بێت، kinetic energy چەند دەبێت؟",
o:["دوو هێندە","سێ هێندە","چوار هێندە","نیم"],
a:2
}

];

let physicsIndex = 0;
let physicsScore = 0;
let physicsTimer = null;
let physicsTime = 30;
let physicsActive = false;

async function load(){

  const response =
    await fetch("/api/data");

  db = await response.json();

  render();
}

function render(){

  if(!me) return;

  document
    .getElementById("auth")
    .classList.add("hidden");

  document
    .getElementById("app")
    .classList.remove("hidden");

  document
    .getElementById("logoutBtn")
    .classList.remove("hidden");

  document
    .getElementById("userName")
    .textContent = me.name;

  const user =
    db.users.find(u => u.id === me.id);

  if(!user) return;

  document
    .getElementById("points")
    .textContent =
      user.points || 0;

  document
    .getElementById("questionsCount")
    .textContent =
      db.questions.filter(
        q => q.userId === me.id
      ).length;

  document
    .getElementById("answersCount")
    .textContent =
      db.answers.filter(
        a => a.userId === me.id
      ).length;

  document
    .getElementById("physicsCount")
    .textContent =
      user.physicsCorrect || 0;

  const xp =
    user.points || 0;

  let rank = "Newbie";

  if(xp >= 100) rank = "Active";
  if(xp >= 300) rank = "Expert";
  if(xp >= 700) rank = "SHALAW Legend";

  document
    .getElementById("rank")
    .textContent = rank;

  const percent =
    Math.min(100,(xp % 100));

  document
    .getElementById("xpBar")
    .style.width =
      percent + "%";

  renderQuestions();
}

function renderQuestions(){

  const box =
    document.getElementById(
      "questionsList"
    );

  box.innerHTML = "";

  db.questions.forEach(q => {

    const owner =
      db.users.find(
        u => u.id === q.userId
      );

    const answers =
      db.answers.filter(
        a => a.questionId === q.id
      );

    const div =
      document.createElement("div");

    div.className = "question";

    const title =
      document.createElement("h3");

    title.textContent =
      owner ? owner.name : "User";

    const text =
      document.createElement("p");

    text.textContent = q.text;

    const like =
      document.createElement("button");

    like.textContent =
      "❤️ " + (q.likes || 0);

    like.onclick =
      () => likeQuestion(q.id);

    div.appendChild(title);
    div.appendChild(text);
    div.appendChild(like);

    answers.forEach(a => {

      const answer =
        document.createElement("div");

      answer.className =
        "answer";

      const user =
        db.users.find(
          u => u.id === a.userId
        );

      answer.textContent =
        (user ? user.name : "User") +
        ": " +
        a.text;

      div.appendChild(answer);

    });

    const input =
      document.createElement("input");

    input.placeholder =
      "وەڵام بنووسە...";

    const btn =
      document.createElement("button");

    btn.textContent = "وەڵام";

    btn.onclick =
      () => answerQuestion(
        q.id,
        input.value
      );

    div.appendChild(input);
    div.appendChild(btn);

    box.appendChild(div);

  });
}

async function signup(){

  const name =
    document.getElementById(
      "signupName"
    ).value.trim();

  const email =
    document.getElementById(
      "signupEmail"
    ).value.trim();

  const password =
    document.getElementById(
      "signupPassword"
    ).value;

  if(!name || !email || !password){

    alert(
      "تکایە هەموو خانەکان پڕ بکەرەوە."
    );

    return;
  }

  if(password.length < 8){

    alert(
      "وشەی نهێنی دەبێت لانیکەم ٨ پیت بێت."
    );

    return;
  }

  const response =
    await fetch("/api/signup",{

      method:"POST",

      headers:{
        "Content-Type":
          "application/json"
      },

      body:JSON.stringify({
        name,
        email,
        password
      })

    });

  const data =
    await response.json();

  if(!response.ok){

    alert(
      data.error ||
      "هەڵە ڕوویدا."
    );

    return;
  }

  me = data;

  localStorage.setItem(
    "me",
    JSON.stringify(me)
  );

  await load();
}

async function login(){

  const email =
    document.getElementById(
      "loginEmail"
    ).value.trim();

  const password =
    document.getElementById(
      "loginPassword"
    ).value;

  if(!email || !password){

    alert(
      "ئیمەیڵ و وشەی نهێنی بنووسە."
    );

    return;
  }

  const response =
    await fetch("/api/login",{

      method:"POST",

      headers:{
        "Content-Type":
          "application/json"
      },

      body:JSON.stringify({
        email,
        password
      })

    });

  const data =
    await response.json();

  if(!response.ok){

    alert(
      data.error ||
      "Login failed."
    );

    return;
  }

  me = data;

  localStorage.setItem(
    "me",
    JSON.stringify(me)
  );

  await load();
}

function logout(){

  localStorage.removeItem("me");

  location.reload();
}

async function ask(){

  const text =
    document.getElementById(
      "questionText"
    ).value.trim();

  if(!text){

    alert(
      "پرسیارێک بنووسە."
    );

    return;
  }

  const response =
    await fetch(
      "/api/questions",
      {

        method:"POST",

        headers:{
          "Content-Type":
            "application/json"
        },

        body:JSON.stringify({
          userId:me.id,
          text
        })

      }
    );

  const data =
    await response.json();

  if(!response.ok){

    alert(
      data.error ||
      "هەڵە ڕوویدا."
    );

    return;
  }

  document
    .getElementById(
      "questionText"
    ).value = "";

  await load();
}

async function likeQuestion(id){

  const response =
    await fetch(
      "/api/questions/" +
      id +
      "/like",
      {
        method:"POST"
      }
    );

  if(response.ok){
    await load();
  }
}

async function answerQuestion(
  questionId,
  text
){

  text = text.trim();

  if(!text) return;

  const response =
    await fetch(
      "/api/questions/" +
      questionId +
      "/answers",
      {

        method:"POST",

        headers:{
          "Content-Type":
            "application/json"
        },

        body:JSON.stringify({
          userId:me.id,
          text
        })

      }
    );

  if(response.ok){
    await load();
  }
}

/* =========================
   PHYSICS
========================= */

function startPhysics(){

  physicsIndex = 0;
  physicsScore = 0;
  physicsActive = true;

  document
    .getElementById(
      "physicsBox"
    )
    .classList.remove("hidden");

  showPhysicsQuestion();
}

function showPhysicsQuestion(){

  clearInterval(
    physicsTimer
  );

  if(
    physicsIndex >=
    physicsQuestions.length
  ){

    finishPhysics();
    return;
  }

  physicsTime = 30;

  document
    .getElementById("timer")
    .textContent =
      physicsTime;

  document
    .getElementById(
      "physicsFeedback"
    ).textContent = "";

  document
    .getElementById(
      "nextPhysicsBtn"
    )
    .classList.add("hidden");

  const q =
    physicsQuestions[
      physicsIndex
    ];

  document
    .getElementById(
      "physicsQuestion"
    )
    .textContent =
      (
        physicsIndex + 1
      ) +
      ". " +
      q.q;

  const options =
    document.getElementById(
      "physicsOptions"
    );

  options.innerHTML = "";

  q.o.forEach(
    (option,index) => {

      const btn =
        document.createElement(
          "button"
        );

      btn.className =
        "option";

      btn.textContent =
        option;

      btn.onclick =
        () => answerPhysics(
          index,
          btn
        );

      options.appendChild(btn);

    }
  );

  physicsTimer =
    setInterval(() => {

      physicsTime--;

      document
        .getElementById("timer")
        .textContent =
          physicsTime;

      if(physicsTime <= 0){

        clearInterval(
          physicsTimer
        );

        answerPhysics(
          -1,
          null
        );

      }

    },1000);
}

function answerPhysics(
  selected,
  clicked
){

  if(!physicsActive)
    return;

  clearInterval(
    physicsTimer
  );

  const q =
    physicsQuestions[
      physicsIndex
    ];

  const buttons =
    document.querySelectorAll(
      "#physicsOptions button"
    );

  buttons.forEach(
    b => b.disabled = true
  );

  if(
    selected === q.a
  ){

    physicsScore++;

    if(clicked){
      clicked.classList.add(
        "correct"
      );
    }

    document
      .getElementById(
        "physicsFeedback"
      ).textContent =
        "✅ ڕاستە! +5 XP";

  }else{

    if(clicked){
      clicked.classList.add(
        "wrong"
      );
    }

    buttons[
      q.a
    ]?.classList.add(
      "correct"
    );

    document
      .getElementById(
        "physicsFeedback"
      ).textContent =
        "❌ هەڵەیە!";
  }

  document
    .getElementById(
      "nextPhysicsBtn"
    )
    .classList.remove("hidden");
}

function nextPhysics(){

  physicsIndex++;

  showPhysicsQuestion();
}

async function finishPhysics(){

  physicsActive = false;

  clearInterval(
    physicsTimer
  );

  document
    .getElementById(
      "physicsFeedback"
    ).textContent =
      "🏁 تەواو بوو! نمرەکەت: " +
      physicsScore +
      " / " +
      physicsQuestions.length;

  document
    .getElementById(
      "nextPhysicsBtn"
    )
    .classList.add("hidden");

  await fetch(
    "/api/physics/result",
    {

      method:"POST",

      headers:{
        "Content-Type":
          "application/json"
      },

      body:JSON.stringify({
        userId:me.id,
        correct:physicsScore
      })

    }
  );

  await load();
}

/* =========================
   START
========================= */

if(me){

  load();

}else{

  document
    .getElementById("auth")
    .classList.remove(
      "hidden"
    );
}

</script>

</body>
</html>
  `);
});

/* =========================
   API
========================= */

app.get("/api/data",(req,res)=>{

  const db = readDB();

  res.json({

    users:
      db.users.map(publicUser),

    questions:
      db.questions,

    answers:
      db.answers

  });

});

/* =========================
   SIGNUP
========================= */

app.post(
  "/api/signup",
  authLimiter,
  async(req,res)=>{

    try{

      const name =
        cleanText(
          req.body.name,
          50
        );

      const email =
        cleanEmail(
          req.body.email
        );

      const password =
        String(
          req.body.password || ""
        );

      if(
        !name ||
        !email ||
        !password
      ){

        return res.status(400)
          .json({
            error:
              "ناو، ئیمەیڵ و وشەی نهێنی پێویستن."
          });

      }

      if(name.length < 2){

        return res.status(400)
          .json({
            error:
              "ناوەکە زۆر کورتە."
          });

      }

      if(!validEmail(email)){

        return res.status(400)
          .json({
            error:
              "ئیمەیڵەکە دروست نییە."
          });

      }

      if(password.length < 8){

        return res.status(400)
          .json({
            error:
              "وشەی نهێنی دەبێت لانیکەم ٨ پیت بێت."
          });

      }

      const db = readDB();

      if(
        db.users.some(
          u =>
            u.email === email
        )
      ){

        return res.status(409)
          .json({
            error:
              "ئەم ئیمەیڵە پێشتر بەکارهاتووە."
          });

      }

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      const user = {

        id:
          Date.now().toString() +
          "-" +
          Math.random()
            .toString(36)
            .slice(2,10),

        name,
        email,
        passwordHash,

        points:0,

        physicsCorrect:0,

        physicsXP:0,

        createdAt:
          new Date().toISOString()

      };

      db.users.push(user);

      writeDB(db);

      res.status(201)
        .json(
          publicUser(user)
        );

    }catch(error){

      console.error(error);

      res.status(500)
        .json({
          error:
            "هەڵەی server."
        });

    }

  }
);

/* =========================
   LOGIN
========================= */

app.post(
  "/api/login",
  authLimiter,
  async(req,res)=>{

    try{

      const email =
        cleanEmail(
          req.body.email
        );

      const password =
        String(
          req.body.password || ""
        );

      const db =
        readDB();

      const user =
        db.users.find(
          u =>
            u.email === email
        );

      if(
        !user ||
        !user.passwordHash
      ){

        return res.status(401)
          .json({
            error:
              "ئیمەیڵ یان وشەی نهێنی هەڵەیە."
          });

      }

      const valid =
        await bcrypt.compare(
          password,
          user.passwordHash
        );

      if(!valid){

        return res.status(401)
          .json({
            error:
              "ئیمەیڵ یان وشەی نهێنی هەڵەیە."
          });

      }

      res.json(
        publicUser(user)
      );

    }catch(error){

      console.error(error);

      res.status(500)
        .json({
          error:
            "هەڵەی server."
        });

    }

  }
);

/* =========================
   QUESTIONS
========================= */

app.post(
  "/api/questions",
  (req,res)=>{

    const userId =
      cleanText(
        req.body.userId,
        120
      );

    const text =
      cleanText(
        req.body.text,
        1000
      );

    if(
      !validId(userId) ||
      text.length < 3
    ){

      return res.status(400)
        .json({
          error:
            "داتا دروست نییە."
        });

    }

    const db =
      readDB();

    const user =
      db.users.find(
        u =>
          u.id === userId
      );

    if(!user){

      return res.status(401)
        .json({
          error:
            "User not found."
        });

    }

    const question = {

      id:
        Date.now().toString() +
        "-" +
        Math.random()
          .toString(36)
          .slice(2,8),

      userId,

      text,

      likes:0,

      createdAt:
        new Date().toISOString()

    };

    db.questions.unshift(
      question
    );

    user.points =
      (user.points || 0) +
      10;

    writeDB(db);

    res.status(201)
      .json(question);

  }
);

/* =========================
   LIKE
========================= */

app.post(
  "/api/questions/:id/like",
  (req,res)=>{

    const db =
      readDB();

    const question =
      db.questions.find(
        q =>
          q.id ===
          req.params.id
      );

    if(!question){

      return res.status(404)
        .json({
          error:
            "Question not found."
        });

    }

    question.likes =
      (question.likes || 0) +
      1;

    const owner =
      db.users.find(
        u =>
          u.id ===
          question.userId
      );

    if(owner){

      owner.points =
        (owner.points || 0) +
        2;

    }

    writeDB(db);

    res.json(question);

  }
);

/* =========================
   ANSWERS
========================= */

app.post(
  "/api/questions/:id/answers",
  (req,res)=>{

    const userId =
      cleanText(
        req.body.userId,
        120
      );

    const text =
      cleanText(
        req.body.text,
        1000
      );

    if(
      !validId(userId) ||
      !text
    ){

      return res.status(400)
        .json({
          error:
            "داتا دروست نییە."
        });

    }

    const db =
      readDB();

    const user =
      db.users.find(
        u =>
          u.id ===
          userId
      );

    if(!user){

      return res.status(401)
        .json({
          error:
            "User not found."
        });

    }

    const question =
      db.questions.find(
        q =>
          q.id ===
          req.params.id
      );

    if(!question){

      return res.status(404)
        .json({
          error:
            "Question not found."
        });

    }

    const answer = {

      id:
        Date.now().toString() +
        "-" +
        Math.random()
          .toString(36)
          .slice(2,8),

      questionId:
        req.params.id,

      userId,

      text,

      createdAt:
        new Date().toISOString()

    };

    db.answers.push(
      answer
    );

    user.points =
      (user.points || 0) +
      15;

    writeDB(db);

    res.status(201)
      .json(answer);

  }
);

/* =========================
   PHYSICS RESULT
========================= */

app.post(
  "/api/physics/result",
  (req,res)=>{

    const userId =
      cleanText(
        req.body.userId,
        120
      );

    const correct =
      Number(
        req.body.correct
      );

    if(
      !validId(userId) ||
      !Number.isInteger(correct) ||
      correct < 0 ||
      correct > 30
    ){

      return res.status(400)
        .json({
          error:
            "Invalid Physics result."
        });

    }

    const db =
      readDB();

    const user =
      db.users.find(
        u =>
          u.id === userId
      );

    if(!user){

      return res.status(401)
        .json({
          error:
            "User not found."
        });

    }

    const earnedXP =
      correct * 5;

    user.physicsCorrect =
      (user.physicsCorrect || 0) +
      correct;

    user.physicsXP =
      (user.physicsXP || 0) +
      earnedXP;

    user.points =
      (user.points || 0) +
      earnedXP;

    writeDB(db);

    res.json({

      correct,

      earnedXP,

      user:
        publicUser(user)

    });

  }
);

/* =========================
   404
========================= */

app.use(
  (req,res)=>{

    res.status(404)
      .json({
        error:
          "Not found."
      });

  }
);

/* =========================
   ERROR
========================= */

app.use(
  (err,req,res,next)=>{

    console.error(err);

    res.status(500)
      .json({
        error:
          "Internal server error."
      });

  }
);

/* =========================
   START
========================= */

app.listen(
  PORT,
  "0.0.0.0",
  ()=>{
    console.log(
      "🔐 SHALAW running on port " +
      PORT
    );
  }
);

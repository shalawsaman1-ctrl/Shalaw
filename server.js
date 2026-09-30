<!DOCTYPE html>
<html lang="ku">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>SHALAW — Community</title>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
    }

    body {
      background: #08090d;
      color: #fff;
      min-height: 100vh;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    button {
      border: 0;
      cursor: pointer;
    }

    /* NAVBAR */
    nav {
      height: 72px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 6%;
      border-bottom: 1px solid rgba(255,255,255,.08);
      background: rgba(8,9,13,.85);
      backdrop-filter: blur(15px);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .logo {
      font-size: 25px;
      font-weight: 900;
      letter-spacing: 2px;
      background: linear-gradient(90deg,#8b5cf6,#ec4899);
      -webkit-background-clip: text;
      color: transparent;
    }

    .nav-links {
      display: flex;
      gap: 25px;
      color: #aaa;
      font-size: 14px;
    }

    .nav-links a:hover {
      color: #fff;
    }

    .login-btn {
      background: linear-gradient(135deg,#7c3aed,#db2777);
      color: white;
      padding: 11px 20px;
      border-radius: 12px;
      font-weight: bold;
    }

    /* HERO */
    .hero {
      min-height: 570px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 40px;
      padding: 70px 7%;
      position: relative;
      overflow: hidden;
    }

    .hero::before {
      content: "";
      position: absolute;
      width: 500px;
      height: 500px;
      background: #7c3aed;
      filter: blur(180px);
      opacity: .18;
      left: -200px;
      top: 50px;
    }

    .hero-text {
      max-width: 650px;
      position: relative;
      z-index: 2;
    }

    .badge {
      display: inline-block;
      padding: 8px 14px;
      border: 1px solid rgba(139,92,246,.4);
      background: rgba(139,92,246,.1);
      color: #c4b5fd;
      border-radius: 30px;
      font-size: 13px;
      margin-bottom: 22px;
    }

    h1 {
      font-size: clamp(45px,7vw,82px);
      line-height: .95;
      margin-bottom: 25px;
      font-weight: 900;
    }

    h1 span {
      background: linear-gradient(90deg,#a78bfa,#f472b6);
      -webkit-background-clip: text;
      color: transparent;
    }

    .hero-text p {
      color: #a1a1aa;
      font-size: 18px;
      line-height: 1.8;
      max-width: 570px;
      margin-bottom: 30px;
    }

    .hero-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .primary {
      background: linear-gradient(135deg,#7c3aed,#db2777);
      color: white;
      padding: 15px 25px;
      border-radius: 14px;
      font-weight: bold;
      box-shadow: 0 15px 40px rgba(124,58,237,.25);
    }

    .secondary {
      background: #14151c;
      border: 1px solid #292b35;
      color: #fff;
      padding: 15px 25px;
      border-radius: 14px;
      font-weight: bold;
    }

    /* HERO CARD */
    .hero-card {
      width: 380px;
      min-height: 390px;
      background: linear-gradient(145deg,#171821,#0e0f15);
      border: 1px solid #282936;
      border-radius: 30px;
      padding: 25px;
      box-shadow: 0 30px 100px rgba(0,0,0,.5);
      position: relative;
      z-index: 2;
    }

    .avatar {
      width: 75px;
      height: 75px;
      border-radius: 22px;
      background: linear-gradient(135deg,#7c3aed,#ec4899);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
      font-weight: bold;
      margin-bottom: 18px;
    }

    .hero-card h3 {
      font-size: 23px;
      margin-bottom: 7px;
    }

    .hero-card small {
      color: #888;
    }

    .level {
      margin-top: 25px;
      background: #0a0b10;
      padding: 18px;
      border-radius: 18px;
    }

    .level-top {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      color: #aaa;
      font-size: 13px;
    }

    .progress {
      height: 9px;
      background: #242630;
      border-radius: 20px;
      overflow: hidden;
    }

    .progress div {
      width: 72%;
      height: 100%;
      background: linear-gradient(90deg,#7c3aed,#ec4899);
      border-radius: 20px;
    }

    /* CONTENT */
    .container {
      width: 86%;
      max-width: 1250px;
      margin: auto;
      padding-bottom: 80px;
    }

    .section-title {
      margin: 35px 0 20px;
      font-size: 27px;
    }

    /* STATS */
    .stats {
      display: grid;
      grid-template-columns: repeat(4,1fr);
      gap: 15px;
    }

    .stat {
      background: #111219;
      border: 1px solid #242630;
      padding: 23px;
      border-radius: 20px;
    }

    .stat span {
      color: #8b8d99;
      font-size: 13px;
    }

    .stat strong {
      display: block;
      font-size: 30px;
      margin-top: 8px;
    }

    /* ACTIONS */
    .actions {
      display: grid;
      grid-template-columns: repeat(3,1fr);
      gap: 15px;
    }

    .action {
      background: #111219;
      border: 1px solid #242630;
      padding: 25px;
      border-radius: 20px;
      transition: .2s;
    }

    .action:hover {
      transform: translateY(-4px);
      border-color: #7c3aed;
    }

    .action-icon {
      font-size: 28px;
      margin-bottom: 15px;
    }

    .action h3 {
      margin-bottom: 7px;
    }

    .action p {
      color: #858794;
      font-size: 14px;
    }

    /* QUESTIONS */
    .question {
      background: #111219;
      border: 1px solid #242630;
      border-radius: 20px;
      padding: 22px;
      margin-bottom: 14px;
    }

    .question-user {
      color: #a78bfa;
      font-weight: bold;
      margin-bottom: 12px;
    }

    .question p {
      color: #ddd;
      line-height: 1.7;
      margin-bottom: 18px;
    }

    .question-actions {
      display: flex;
      gap: 10px;
    }

    .small-btn {
      background: #1b1c25;
      color: #aaa;
      padding: 9px 14px;
      border-radius: 10px;
    }

    .small-btn:hover {
      color: white;
    }

    /* LEADERBOARD */
    .leaderboard {
      background: #111219;
      border: 1px solid #242630;
      border-radius: 22px;
      overflow: hidden;
    }

    .player {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 22px;
      border-bottom: 1px solid #20212a;
    }

    .player:last-child {
      border-bottom: 0;
    }

    .player-left {
      display: flex;
      align-items: center;
      gap: 13px;
    }

    .rank {
      width: 35px;
      height: 35px;
      border-radius: 10px;
      background: #20212a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .xp {
      color: #a78bfa;
      font-weight: bold;
    }

    /* FOOTER */
    footer {
      border-top: 1px solid #20212a;
      padding: 35px 7%;
      color: #777;
      text-align: center;
    }

    /* MODAL */
    .modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.75);
      backdrop-filter: blur(8px);
      z-index: 500;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-box {
      width: 100%;
      max-width: 430px;
      background: #111219;
      border: 1px solid #292b36;
      border-radius: 25px;
      padding: 28px;
    }

    .modal-box h2 {
      margin-bottom: 20px;
    }

    input,
    textarea {
      width: 100%;
      background: #08090d;
      color: white;
      border: 1px solid #292b36;
      padding: 14px;
      border-radius: 12px;
      margin-bottom: 12px;
      outline: none;
    }

    textarea {
      min-height: 130px;
      resize: vertical;
    }

    input:focus,
    textarea:focus {
      border-color: #7c3aed;
    }

    .close {
      float: right;
      background: transparent;
      color: #777;
      font-size: 22px;
    }

    .form-btn {
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      background: linear-gradient(135deg,#7c3aed,#db2777);
      color: white;
      font-weight: bold;
      margin-top: 5px;
    }

    .switch {
      text-align: center;
      color: #888;
      margin-top: 15px;
      font-size: 13px;
    }

    .switch span {
      color: #a78bfa;
      cursor: pointer;
    }

    /* RESPONSIVE */
    @media(max-width:900px) {
      .hero {
        flex-direction: column;
        text-align: center;
      }

      .hero-text {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .hero-card {
        width: 100%;
        max-width: 430px;
      }

      .stats {
        grid-template-columns: repeat(2,1fr);
      }

      .actions {
        grid-template-columns: 1fr;
      }

      .nav-links {
        display: none;
      }
    }

    @media(max-width:520px) {
      nav {
        padding: 0 5%;
      }

      .hero {
        padding: 55px 5%;
      }

      .container {
        width: 90%;
      }

      .stats {
        grid-template-columns: 1fr 1fr;
      }

      .stat {
        padding: 17px;
      }

      .stat strong {
        font-size: 23px;
      }

      h1 {
        font-size: 52px;
      }
    }
  </style>
</head>

<body>

  <!-- NAVBAR -->
  <nav>
    <div class="logo">SHALAW</div>

    <div class="nav-links">
      <a href="#home">Home</a>
      <a href="#community">Community</a>
      <a href="#leaderboard">Leaderboard</a>
    </div>

    <button class="login-btn" onclick="openLogin()">Login</button>
  </nav>

  <!-- HERO -->
  <section class="hero" id="home">

    <div class="hero-text">

      <div class="badge">✦ Welcome to SHALAW</div>

      <h1>
        Your place.<br>
        Your <span>community.</span>
      </h1>

      <p>
        SHALAW ـە شوێنێکی نوێ بۆ پرسیارکردن،
        فێربوون، هاوبەشکردنی بیرۆکە و پەیوەندی
        لەگەڵ کۆمەڵگە.
      </p>

      <div class="hero-buttons">
        <button class="primary" onclick="openSignup()">
          دروستکردنی ئەکاونت
        </button>

        <button class="secondary" onclick="openQuestion()">
          + پرسیارێک بکە
        </button>
      </div>

    </div>

    <div class="hero-card">

      <div class="avatar">S</div>

      <h3>SHALAW User</h3>
      <small>Community Member</small>

      <div class="level">

        <div class="level-top">
          <span>Level 12</span>
          <span>7,240 XP</span>
        </div>

        <div class="progress">
          <div></div>
        </div>

      </div>

      <div class="stats" style="margin-top:15px;grid-template-columns:1fr 1fr;">

        <div class="stat">
          <span>Questions</span>
          <strong>24</strong>
        </div>

        <div class="stat">
          <span>Answers</span>
          <strong>81</strong>
        </div>

      </div>

    </div>

  </section>

  <!-- MAIN -->
  <main class="container">

    <h2 class="section-title">Overview</h2>

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

    <h2 class="section-title">Quick Actions</h2>

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
        <p>شوێنی خۆت لە لیستی بەشداربووان ببینە.</p>
      </div>

    </div>

    <h2 class="section-title" id="community">
      Community Questions
    </h2>

    <div id="questions">

      <div class="question">

        <div class="question-user">
          👤 SHALAW Member
        </div>

        <p>
          چۆن دەتوانم زانیاری زیاتر لەسەر فیزیا و
          تەکنەلۆجیا بەدەست بهێنم؟
        </p>

        <div class="question-actions">
          <button class="small-btn">❤️ 12</button>
          <button class="small-btn">💬 5</button>
        </div>

      </div>

      <div class="question">

        <div class="question-user">
          👤 Community
        </div>

        <p>
          باشترین ڕێگا بۆ فێربوونی پرۆگرامسازی چییە؟
        </p>

        <div class="question-actions">
          <button class="small-btn">❤️ 24</button>
          <button class="small-btn">💬 8</button>
        </div>

      </div>

    </div>

    <h2 class="section-title" id="leaderboard">
      🏆 Leaderboard
    </h2>

    <div class="leaderboard">

      <div class="player">
        <div class="player-left">
          <div class="rank">1</div>
          <strong>Shalaw</strong>
        </div>
        <div class="xp">9,820 XP</div>
      </div>

      <div class="player">
        <div class="player-left">
          <div class="rank">2</div>
          <strong>Member Two</strong>
        </div>
        <div class="xp">8,540 XP</div>
      </div>

      <div class="player">
        <div class="player-left">
          <div class="rank">3</div>
          <strong>Member Three</strong>
        </div>
        <div class="xp">7,920 XP</div>
      </div>

      <div class="player">
        <div class="player-left">
          <div class="rank">4</div>
          <strong>Member Four</strong>
        </div>
        <div class="xp">7,310 XP</div>
      </div>

    </div>

  </main>

  <!-- LOGIN MODAL -->
  <div class="modal" id="loginModal">

    <div class="modal-box">

      <button class="close" onclick="closeModal('loginModal')">
        ×
      </button>

      <h2>Login</h2>

      <input id="loginEmail" type="email" placeholder="Email">

      <input id="loginPassword" type="password" placeholder="Password">

      <button class="form-btn" onclick="login()">
        Login
      </button>

      <div class="switch">
        ئەکاونتت نییە؟
        <span onclick="switchToSignup()">Signup</span>
      </div>

    </div>

  </div>

  <!-- SIGNUP MODAL -->
  <div class="modal" id="signupModal">

    <div class="modal-box">

      <button class="close" onclick="closeModal('signupModal')">
        ×
      </button>

      <h2>Create Account</h2>

      <input id="signupName" type="text" placeholder="Name">

      <input id="signupEmail" type="email" placeholder="Email">

      <input id="signupPassword" type="password" placeholder="Password">

      <button class="form-btn" onclick="signup()">
        Create Account
      </button>

      <div class="switch">
        ئەکاونتت هەیە؟
        <span onclick="switchToLogin()">Login</span>
      </div>

    </div>

  </div>

  <!-- QUESTION MODAL -->
  <div class="modal" id="questionModal">

    <div class="modal-box">

      <button class="close" onclick="closeModal('questionModal')">
        ×
      </button>

      <h2>Ask a Question</h2>

      <textarea
        id="questionText"
        placeholder="پرسیارەکەت لێرە بنووسە..."
      ></textarea>

      <button class="form-btn" onclick="sendQuestion()">
        Publish Question
      </button>

    </div>

  </div>

  <footer>
    © 2026 SHALAW — Built for the community.
  </footer>

  <script>

    function openLogin() {
      document.getElementById("loginModal").style.display = "flex";
    }

    function openSignup() {
      document.getElementById("signupModal").style.display = "flex";
    }

    function openQuestion() {
      document.getElementById("questionModal").style.display = "flex";
    }

    function closeModal(id) {
      document.getElementById(id).style.display = "none";
    }

    function switchToSignup() {
      closeModal("loginModal");
      openSignup();
    }

    function switchToLogin() {
      closeModal("signupModal");
      openLogin();
    }

    window.onclick = function(e) {
      if (e.target.classList.contains("modal")) {
        e.target.style.display = "none";
      }
    };

    async function login() {

      const email =
        document.getElementById("loginEmail").value;

      const password =
        document.getElementById("loginPassword").value;

      if (!email || !password) {
        alert("تکایە هەموو خانەکان پڕ بکەرەوە.");
        return;
      }

      try {

        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "Login failed");
          return;
        }

        localStorage.setItem("token", data.token);

        alert("بە سەرکەوتوویی چوویتە ژوورەوە ✅");

        closeModal("loginModal");

      } catch (error) {

        alert("هەڵەیەک ڕوویدا.");

      }
    }

    async function signup() {

      const name =
        document.getElementById("signupName").value;

      const email =
        document.getElementById("signupEmail").value;

      const password =
        document.getElementById("signupPassword").value;

      if (!name || !email || !password) {
        alert("تکایە هەموو خانەکان پڕ بکەرەوە.");
        return;
      }

      try {

        const response = await fetch("/api/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            email,
            password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "Signup failed");
          return;
        }

        localStorage.setItem("token", data.token);

        alert("ئەکاونتەکەت دروستکرا ✅");

        closeModal("signupModal");

      } catch (error) {

        alert("هەڵەیەک ڕوویدا.");

      }
    }

    async function sendQuestion() {

      const text =
        document.getElementById("questionText").value;

      if (!text.trim()) {
        alert("تکایە پرسیارەکەت بنووسە.");
        return;
      }

      const token =
        localStorage.getItem("token");

      if (!token) {
        alert("تکایە سەرەتا Login بکە.");
        closeModal("questionModal");
        openLogin();
        return;
      }

      try {

        const response = await fetch("/api/questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify({
            text
          })
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "Failed");
          return;
        }

        alert("پرسیارەکەت بڵاوکرایەوە ✅");

        document.getElementById("questionText").value = "";

        closeModal("questionModal");

        loadQuestions();

      } catch (error) {

        alert("هەڵەیەک ڕوویدا.");

      }
    }

    async function loadQuestions() {

      try {

        const response =
          await fetch("/api/questions");

        if (!response.ok) return;

        const questions =
          await response.json();

        const container =
          document.getElementById("questions");

        if (!Array.isArray(questions)) return;

        container.innerHTML = "";

        questions.forEach(q => {

          const div =
            document.createElement("div");

          div.className = "question";

          div.innerHTML = `
            <div class="question-user">
              👤 ${escapeHTML(q.user?.name || "Member")}
            </div>

            <p>${escapeHTML(q.text || "")}</p>

            <div class="question-actions">
              <button class="small-btn">
                ❤️ ${q.likes || 0}
              </button>

              <button class="small-btn">
                💬 ${q.answersCount || 0}
              </button>
            </div>
          `;

          container.appendChild(div);

        });

      } catch (error) {

        console.log(error);

      }

    }

    function escapeHTML(text) {

      const div =
        document.createElement("div");

      div.textContent = text;

      return div.innerHTML;

    }

    loadQuestions();

  </script>

</body>
</html>

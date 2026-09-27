import "./styles.css";

const icons = {
  chart: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V9m6 10V5m6 14v-7m4 7H2"/></svg>`,
  user: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c.7-4 3.3-6 8-6s7.3 2 8 6"/></svg>`,
  lock: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
  eye: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>`,
  home: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></svg>`,
  edit: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>`,
  bell: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>`,
  arrow: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>`,
  logout: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 17l5-5-5-5m5 5H3m11-9h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6"/></svg>`,
  menu: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  spark: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8ZM19 15l.7 2.3L22 18l-2.3.7L19 22l-.7-2.3L16 18l2.3-.7Z"/></svg>`,
  shield: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></svg>`,
  check: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>`,
  back: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>`
  ,mail: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`
};

const subjects = [
  { code: "ME-301", name: "Fluid Mechanics", avg: 68, sd: 12, score: 84 },
  { code: "ME-302", name: "Heat Transfer", avg: 64, sd: 14, score: 76 },
  { code: "ME-303", name: "Theory of Machines", avg: 71, sd: 10, score: 81 },
  { code: "ME-304", name: "Manufacturing Science", avg: 66, sd: 13, score: 73 },
  { code: "ME-305", name: "Machine Design", avg: 62, sd: 15, score: 79 }
];

const app = document.querySelector("#app");
const state = {
  loggedIn: sessionStorage.getItem("batchlens_auth") === "true",
  view: "dashboard",
  subject: 0,
  semester: 5,
  scores: JSON.parse(localStorage.getItem("batchlens_scores") || "null") || subjects.map(s => s.score)
};

function brand() {
  return `<div class="brand"><div class="brand-mark">${icons.chart}</div><span>Batch<em>Lens</em></span></div>`;
}

function renderLogin() {
  app.innerHTML = `
    <main class="login-shell">
      <section class="login-panel">
        ${brand()}
        <div class="login-content">
          <span class="eyebrow">Student portal</span>
          <h1>Know where<br/>you stand.</h1>
          <p>Private, meaningful academic insights — built for your batch, powered by shared progress.</p>
          <form id="loginForm">
            <div class="field"><label for="studentId">Institute login ID</label><div class="input-wrap">${icons.user}<input id="studentId" autocomplete="username" placeholder="e.g. 2023ME10542" required /></div></div>
            <div class="field"><label for="password">Password</label><div class="input-wrap">${icons.lock}<input id="password" type="password" autocomplete="current-password" placeholder="Enter your password" required /><button class="password-toggle" type="button" aria-label="Show password">${icons.eye}</button></div></div>
            <div class="login-meta"><label class="check"><input type="checkbox" checked /> Keep me signed in</label><a class="text-link" href="#">Forgot password?</a></div>
            <button class="primary-btn full" type="submit">Sign in securely ${icons.arrow}</button>
          </form>
          <p class="account-prompt">New to BatchLens? <button class="inline-action" id="showCreateAccount" type="button">Create an account</button></p>
          <div class="demo-line">OR EXPLORE THE PROTOTYPE</div>
          <button class="demo-btn" id="demoLogin">Use demo student account</button>
        </div>
        <p class="login-foot">Available only to verified institute students · Your scores stay private</p>
      </section>
      <aside class="login-visual">
        <div class="visual-copy">
          <span class="eyebrow">One batch. Clearer perspective.</span>
          <h2>Your marks tell a story.<br/>See the full picture.</h2>
          <p>Compare your performance anonymously across 400+ batchmates, understand every subject, and focus where it matters.</p>
        </div>
        <div class="mini-chart">
          <svg viewBox="0 0 640 230" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="loginFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8ef83" stop-opacity=".28"/><stop offset="1" stop-color="#d8ef83" stop-opacity="0"/></linearGradient></defs>
            <path d="M0 225 C100 225 140 214 185 175 C230 136 247 46 320 42 C393 38 414 136 455 174 C498 214 540 224 640 225 L640 230 L0 230Z" fill="url(#loginFill)"/>
            <path d="M0 225 C100 225 140 214 185 175 C230 136 247 46 320 42 C393 38 414 136 455 174 C498 214 540 224 640 225" fill="none" stroke="#d8ef83" stroke-width="3"/>
            <line x1="433" x2="433" y1="30" y2="230" stroke="#f4a06d" stroke-width="2" stroke-dasharray="6 6"/>
            <circle cx="433" cy="155" r="6" fill="#f4a06d" stroke="#173f31" stroke-width="3"/>
          </svg>
          <div class="chart-dot-label">Top 18% of your class</div>
        </div>
        <div class="privacy-note">${icons.shield} Scores are anonymised. Only you can see your individual marks.</div>
      </aside>
    </main>`;

  const form = document.querySelector("#loginForm");
  form.addEventListener("submit", (e) => { e.preventDefault(); login(); });
  document.querySelector("#demoLogin").addEventListener("click", () => {
    document.querySelector("#studentId").value = "2023ME10542";
    document.querySelector("#password").value = "demo123";
    setTimeout(login, 180);
  });
  document.querySelector(".password-toggle").addEventListener("click", () => {
    const el = document.querySelector("#password");
    el.type = el.type === "password" ? "text" : "password";
  });
  document.querySelector("#showCreateAccount").addEventListener("click", renderCreateAccount);
}

function renderCreateAccount() {
  app.innerHTML = `
    <main class="login-shell">
      <section class="login-panel">
        ${brand()}
        <div class="login-content create-account-content">
          <button class="back-btn account-back" id="backToLogin" type="button">${icons.back} Back to sign in</button>
          <span class="eyebrow">Student registration</span>
          <h1>Create your<br/>account.</h1>
          <p>Use your institute details so your scores are matched to the correct batch.</p>
          <form id="createAccountForm">
            <div class="form-row account-row">
              <div class="field"><label for="fullName">Full name</label><div class="input-wrap">${icons.user}<input id="fullName" autocomplete="name" placeholder="Your full name" required /></div></div>
              <div class="field"><label for="newStudentId">Institute login ID</label><div class="input-wrap">${icons.user}<input id="newStudentId" autocomplete="username" placeholder="e.g. 2023ME10542" required /></div></div>
            </div>
            <div class="field"><label for="instituteEmail">Institute email</label><div class="input-wrap">${icons.mail}<input id="instituteEmail" type="email" autocomplete="email" placeholder="you@college.ac.in" required /></div><small class="field-hint">Use the email address issued by your institute.</small></div>
            <div class="form-row account-row">
              <div class="field"><label for="newPassword">Create password</label><div class="input-wrap">${icons.lock}<input id="newPassword" type="password" autocomplete="new-password" minlength="8" placeholder="At least 8 characters" required /></div></div>
              <div class="field"><label for="confirmPassword">Confirm password</label><div class="input-wrap">${icons.lock}<input id="confirmPassword" type="password" autocomplete="new-password" minlength="8" placeholder="Re-enter password" required /></div></div>
            </div>
            <p class="form-error" id="createAccountError" role="alert" aria-live="polite"></p>
            <label class="check terms-check"><input id="acceptTerms" type="checkbox" required /> I agree to keep submitted marks accurate and respect batch privacy.</label>
            <button class="primary-btn full" type="submit">Create account ${icons.arrow}</button>
          </form>
          <p class="account-prompt">Already registered? <button class="inline-action" id="signInInstead" type="button">Sign in instead</button></p>
        </div>
        <p class="login-foot">Registration is limited to verified institute students · Your scores stay private</p>
      </section>
      <aside class="login-visual account-visual">
        <div class="visual-copy">
          <span class="eyebrow">Your private academic space</span>
          <h2>Join your batch.<br/>Find your focus.</h2>
          <p>Create one verified profile to submit scores, track your progress, and compare performance through anonymous class insights.</p>
        </div>
        <div class="account-benefits">
          <div>${icons.shield}<span><strong>Private by design</strong><small>Your individual marks remain visible only to you.</small></span></div>
          <div>${icons.chart}<span><strong>Useful perspective</strong><small>See percentiles and subject-level standing.</small></span></div>
          <div>${icons.check}<span><strong>One verified profile</strong><small>Institute details help protect batch data.</small></span></div>
        </div>
      </aside>
    </main>`;

  document.querySelector("#backToLogin").addEventListener("click", renderLogin);
  document.querySelector("#signInInstead").addEventListener("click", renderLogin);
  document.querySelector("#createAccountForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const password = document.querySelector("#newPassword").value;
    const confirmPassword = document.querySelector("#confirmPassword").value;
    const error = document.querySelector("#createAccountError");
    if (password !== confirmPassword) {
      error.textContent = "Passwords do not match. Please try again.";
      document.querySelector("#confirmPassword").focus();
      return;
    }
    const account = {
      name: document.querySelector("#fullName").value.trim(),
      studentId: document.querySelector("#newStudentId").value.trim(),
      email: document.querySelector("#instituteEmail").value.trim()
    };
    localStorage.setItem("batchlens_account", JSON.stringify(account));
    sessionStorage.setItem("batchlens_auth", "true");
    state.loggedIn = true;
    renderPortal();
    const toast = document.createElement("div");
    toast.className = "save-toast";
    toast.innerHTML = `${icons.check} Account created. Welcome to BatchLens.`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2400);
  });
}

function login() {
  sessionStorage.setItem("batchlens_auth", "true");
  state.loggedIn = true;
  renderPortal();
}

function sidebar() {
  return `<aside class="sidebar" id="sidebar">
    ${brand()}
    <div class="nav-label">Workspace</div>
    <button class="nav-item ${state.view === "dashboard" ? "active" : ""}" data-view="dashboard">${icons.home} Overview</button>
    <button class="nav-item ${state.view === "performance" ? "active" : ""}" data-view="performance">${icons.chart} Relative performance</button>
    <button class="nav-item ${state.view === "submit" ? "active" : ""}" data-view="submit">${icons.edit} Submit scores</button>
    <div class="nav-label">Academic record</div>
    <div class="semester-block">
      ${[1,2,3,4,5,6].map(s => `<div class="semester-row ${s === state.semester ? "active" : ""}"><span>Semester ${s}</span><i class="sem-dot"></i></div>`).join("")}
    </div>
    <div class="sidebar-profile"><div class="avatar">RD</div><div><strong>Richa Dubey</strong><small>2023ME10542</small></div><button class="logout" title="Sign out">${icons.logout}</button></div>
  </aside>`;
}

function shell(content, title = "Academic Performance", subtitle = "Mechanical Engineering · Batch of 2027") {
  return `<div class="portal">${sidebar()}<div class="main">
    <header class="topbar"><button class="icon-btn mobile-menu" aria-label="Open menu">${icons.menu}</button><div class="top-title"><h1>${title}</h1><p>${subtitle}</p></div><div class="top-actions"><button class="icon-btn" aria-label="Search">${icons.chart}</button><button class="icon-btn" aria-label="Notifications">${icons.bell}<i class="notify-dot"></i></button></div></header>
    <div class="content">${content}</div></div></div>`;
}

function gaussianPath(mean, sd, width = 860, height = 210, xStart = 30, yBase = 220) {
  const points = [];
  let maxY = 0;
  for (let score = 0; score <= 100; score += 1) {
    const y = Math.exp(-0.5 * Math.pow((score - mean) / sd, 2));
    maxY = Math.max(maxY, y); points.push({score,y});
  }
  return points.map((p,i) => `${i ? "L" : "M"} ${(xStart + p.score/100*width).toFixed(1)} ${(yBase - p.y/maxY*height).toFixed(1)}`).join(" ");
}

function distributionChart(subject) {
  const score = state.scores[state.subject];
  const x = 30 + score / 100 * 860;
  const curveY = 220 - Math.exp(-0.5 * Math.pow((score-subject.avg)/subject.sd,2))*210;
  const path = gaussianPath(subject.avg, subject.sd);
  const area = `${path} L890 220 L30 220 Z`;
  return `<div class="chart-area"><div class="chart-legend"><span class="legend-item"><i class="legend-line"></i> Class distribution</span><span class="legend-item"><i class="legend-line you"></i> Your score</span></div>
    <svg class="distribution-chart" viewBox="0 0 920 270" role="img" aria-label="Class score distribution">
      <defs><linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9bc8b2" stop-opacity=".38"/><stop offset="1" stop-color="#9bc8b2" stop-opacity=".02"/></linearGradient></defs>
      ${[20,40,60,80,100].map(v => `<line x1="${30+v/100*860}" x2="${30+v/100*860}" y1="10" y2="220" stroke="#edf1ee"/><text class="axis-label" x="${30+v/100*860}" y="244" text-anchor="middle">${v}</text>`).join("")}
      <line x1="30" x2="890" y1="220" y2="220" stroke="#ccd8d1"/>
      <path d="${area}" fill="url(#curveFill)"/>
      <path d="${path}" fill="none" stroke="#4f9574" stroke-width="3" stroke-linecap="round"/>
      <line x1="${x}" x2="${x}" y1="22" y2="220" stroke="#f08c56" stroke-width="2" stroke-dasharray="5 6"/>
      <circle cx="${x}" cy="${Math.max(10,curveY)}" r="6" fill="#f08c56" stroke="white" stroke-width="3"/>
      <g class="chart-annotation" transform="translate(${Math.min(780,Math.max(40,x-55))},2)"><rect width="110" height="35" rx="9" fill="#173f31"/><text x="55" y="14" text-anchor="middle" fill="#9ec0b0" font-size="8">YOUR SCORE</text><text x="55" y="27" text-anchor="middle" fill="white" font-size="12" font-weight="700">${score} / 100</text></g>
      <text class="axis-label" x="30" y="262">Lower scores</text><text class="axis-label" x="890" y="262" text-anchor="end">Higher scores</text>
    </svg>
    <div class="insight-strip">${icons.spark}<span><strong>You scored ${score - subject.avg} marks above the class average.</strong> Your strongest position is among the upper-performing group in ${subject.name}.</span></div>
  </div>`;
}

function performancePanel(full = false) {
  const subject = subjects[state.subject];
  const score = state.scores[state.subject];
  const percentile = Math.min(99, Math.round(50 + (score-subject.avg)/(subject.sd*2.4)*50));
  const rank = Math.max(1, Math.round(401*(1-percentile/100)));
  return `<section class="panel">
    <div class="panel-head"><div><h3>${full ? "Your position in the batch" : "Performance snapshot"}</h3><p>Anonymous comparison across 401 verified students</p></div>
      <div class="filters"><div class="select-wrap"><select id="subjectFilter">${subjects.map((s,i)=>`<option value="${i}" ${i===state.subject?"selected":""}>${s.name}</option>`).join("")}</select></div><div class="select-wrap"><select><option>Section A–C</option><option>Section A</option><option>Section B</option><option>Section C</option></select></div></div>
    </div>
    <div class="metric-grid"><div class="metric"><div class="metric-label">Your score</div><div class="metric-value">${score}<small>/100</small></div><div class="metric-sub positive">↑ ${score-subject.avg} vs average</div></div><div class="metric"><div class="metric-label">Class average</div><div class="metric-value">${subject.avg}</div><div class="metric-sub">Median ${subject.avg+2}</div></div><div class="metric"><div class="metric-label">Your percentile</div><div class="metric-value">${percentile}<small>th</small></div><div class="metric-sub positive">Upper ${100-percentile}% of class</div></div><div class="metric"><div class="metric-label">Estimated rank</div><div class="metric-value">${rank}<small>/401</small></div><div class="metric-sub">Based on submitted scores</div></div></div>
    ${distributionChart(subject)}
  </section>`;
}

function dashboard() {
  return `<div class="welcome"><div><h2>Good evening, Richa.</h2><p>Here’s where you stand after the latest score update.</p></div><span class="status-pill"><i></i> 386 of 401 students submitted</span></div>
  <div class="action-grid"><button class="action-card submit" data-view="submit"><span class="action-icon">${icons.edit}</span><strong>Submit your scores</strong><span>Add or update marks for this semester</span><span class="arrow">${icons.arrow}</span><i class="action-art"></i></button><button class="action-card performance" data-view="performance"><span class="action-icon">${icons.chart}</span><strong>Explore relative performance</strong><span>See rank, percentile and subject insights</span><span class="arrow">${icons.arrow}</span><i class="action-art"></i></button></div>
  ${performancePanel(false)}`;
}

function performanceView() {
  return `<div class="welcome"><div><h2>Relative performance</h2><p>Your identity stays private; only aggregate class data is shown.</p></div><span class="status-pill"><i></i> Updated 12 minutes ago</span></div>${performancePanel(true)}`;
}

function submitView() {
  return `<button class="back-btn" data-view="dashboard">${icons.back} Back to overview</button><div class="welcome"><div><h2>Submit subject scores</h2><p>Enter your latest evaluated marks. You can update them later.</p></div></div>
  <div class="form-layout"><section class="panel score-form"><div class="form-row"><div class="field"><label>Semester</label><select class="form-select"><option>Semester 5 · Aug–Dec 2026</option><option>Semester 4 · Jan–May 2026</option></select></div><div class="field"><label>Assessment</label><select class="form-select"><option>End Semester Examination</option><option>Mid Semester Examination</option><option>Combined total</option></select></div></div>
    <div class="subject-list"><div class="subject-head"><span>Subject</span><span>Your score</span><span>Maximum</span></div>${subjects.map((s,i)=>`<div class="subject-input-row"><div class="subject-name"><strong>${s.name}</strong><small>${s.code}</small></div><input class="score-input" type="number" min="0" max="100" value="${state.scores[i]}" data-index="${i}" aria-label="${s.name} score"/><span class="max-marks">100</span></div>`).join("")}</div>
    <div class="form-actions"><button class="secondary-btn" data-view="dashboard">Cancel</button><button class="primary-btn" id="saveScores">${icons.check} Save scores</button></div></section>
    <aside class="panel tip-card">${icons.shield}<h3>Your marks are private</h3><p>Individual scores are never shown to classmates. BatchLens only uses anonymous aggregates to calculate standing.</p><ul><li>Use final published marks</li><li>Check each entry before saving</li><li>Updates recalculate your position</li></ul></aside></div>`;
}

function renderPortal() {
  const body = state.view === "submit" ? submitView() : state.view === "performance" ? performanceView() : dashboard();
  app.innerHTML = shell(body, state.view === "submit" ? "Score Repository" : state.view === "performance" ? "Class Insights" : "Academic Performance");
  bindPortal();
}

function bindPortal() {
  document.querySelectorAll("[data-view]").forEach(el => el.addEventListener("click", () => { state.view = el.dataset.view; renderPortal(); window.scrollTo(0,0); }));
  document.querySelector(".logout")?.addEventListener("click", () => { sessionStorage.removeItem("batchlens_auth"); state.loggedIn=false; renderLogin(); });
  document.querySelector(".mobile-menu")?.addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
  document.querySelector("#subjectFilter")?.addEventListener("change", (e) => { state.subject=Number(e.target.value); renderPortal(); });
  document.querySelector("#saveScores")?.addEventListener("click", () => {
    const inputs = [...document.querySelectorAll(".score-input")];
    const invalid = inputs.find(i => i.value === "" || Number(i.value)<0 || Number(i.value)>100);
    if (invalid) { invalid.focus(); invalid.style.borderColor="#dc6b54"; return; }
    state.scores = inputs.map(i => Number(i.value));
    localStorage.setItem("batchlens_scores", JSON.stringify(state.scores));
    const toast = document.createElement("div"); toast.className="save-toast"; toast.innerHTML=`${icons.check} Scores saved. Your standing is updated.`; document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); state.view="performance"; renderPortal(); }, 1100);
  });
}

state.loggedIn ? renderPortal() : renderLogin();

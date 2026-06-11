console.log("Edeh Dev Tracker v2 - JS Loaded ✅");

// ============================================================
//  STORAGE HELPERS
//  - getItem with fallback in one line
//  - keeps code DRY (Don't Repeat Yourself)
// ============================================================
function getNum(key, fallback = 0) {
  return Number(localStorage.getItem(key)) || fallback;
}

function getJSON(key, fallback = {}) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

// ============================================================
//  STATE
//  - All variables in one place at the top
//  - Easy to find and update
// ============================================================
let name = localStorage.getItem("name") || "Developer";
let gymDay = getNum("gymDay", 1);
let sessionSeconds = 0;
let timerInterval = null;

// ============================================================
//  TIME — updates every second
// ============================================================
function updateTime() {
  document.getElementById("time").innerText = new Date().toLocaleString();
}
setInterval(updateTime, 1000);
updateTime();

// ============================================================
//  DAY COUNT
//  - Checks manual override first
//  - Falls back to start date calculation
// ============================================================
function getDayCount() {
  let manual = localStorage.getItem("manualDay");
  if (manual) return Number(manual);

  let start = localStorage.getItem("startDate");
  if (!start) {
    start = new Date().toISOString();
    localStorage.setItem("startDate", start);
  }

  let startDate = new Date(start);
  let today = new Date();

  // strip time so hour of day doesn't affect count
  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
}

// FIX: was hardcoded to 131 — now uses a prompt so you can fix any day
function fixDay() {
  let input = prompt("Enter the correct day number:");
  if (!input || isNaN(input)) return;

  let dayNum = Number(input);
  localStorage.setItem("manualDay", dayNum);

  // fill any missing days in completedDays record
  let completed = getJSON("completedDays", {});
  for (let i = 1; i <= dayNum; i++) {
    if (!(i in completed)) completed[i] = false;
  }
  localStorage.setItem("completedDays", JSON.stringify(completed));

  showToast(`Day fixed to ${dayNum} ✅`);
  location.reload();
}

function setStartDate() {
  let date = prompt("Enter start date (YYYY-MM-DD):");
  if (!date) return;

  localStorage.setItem("startDate", date);
  localStorage.removeItem("manualDay");
  showToast("Start date updated ✅");
  location.reload();
}

// ============================================================
//  GREETING
// ============================================================
function updateGreeting() {
  let hour = new Date().getHours();
  let greet = hour < 12 ? "Good morning" :
              hour < 18 ? "Good afternoon" : "Good evening";
  document.getElementById("greeting").innerText = `${greet}, ${name}`;
}

// ============================================================
//  NAVIGATION
// ============================================================
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  // highlight active nav button
  document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.remove("nav-active"));
  event.currentTarget.classList.add("nav-active");

  // load section-specific data
  if (id === "calendar-section") renderCalendar();
  if (id === "progress-section") renderChart();
  if (id === "achievements-section") updateAchievements(getDayCount());
  if (id === "settings-section") loadSettings();
}

// ============================================================
//  THEME TOGGLE
// ============================================================
function toggleTheme() {
  let dark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", dark ? "dark" : "light");
}

// apply saved theme on load
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

// ============================================================
//  STREAK
// ============================================================
function updateStreak(day) {
  let lastDay = getNum("lastActiveDay");
  let streak = getNum("mainStreak");

  if (day === lastDay + 1) {
    streak++;
  } else if (day !== lastDay) {
    streak = 1;
  }

  localStorage.setItem("lastActiveDay", day);
  localStorage.setItem("mainStreak", streak);

  document.getElementById("consistency").innerText = `🔥 Streak: ${streak} days`;
}

// ============================================================
//  LEVEL / RANK
// ============================================================
function getLevel() {
  let completed = getJSON("completedDays", {});
  let total = Object.keys(completed).length || 1;
  let done = Object.values(completed).filter(v => v === true).length;
  let rate = (done / total) * 100;

  if (rate >= 90) return "🏆 Legend";
  if (rate >= 75) return "🚀 Elite";
  if (rate >= 60) return "🔥 Strong";
  if (rate >= 40) return "⚠️ Average";
  return "🐢 Beginner";
}

// ============================================================
//  XP SYSTEM
//  FIX: all XP display in one function, no duplication
// ============================================================
function updateXP() {
  let xp = getNum("xp");
  let xpNext = xp % 100; // progress within current level

  // text
  document.getElementById("xpText").innerText = `⚡ XP: ${xpNext} / 100`;

  // bar fill
  let xpBar = document.getElementById("xpBar");
  xpBar.style.width = xpNext + "%";

  // bar color by progress
  if (xpNext < 50) {
    xpBar.style.background = "orange";
  } else if (xpNext < 90) {
    xpBar.style.background = "limegreen";
  } else {
    xpBar.style.background = "gold";
  }

  // motivation message
  let xpMessage = document.getElementById("xpMessage");
  if (xp < 50)       xpMessage.innerText = "You're just getting started 🚶‍♂️";
  else if (xp < 90)  xpMessage.innerText = "Halfway there 🔥";
  else if (xp < 100) xpMessage.innerText = "Almost there 👀";
  else               xpMessage.innerText = "Level up zone 🚀";

  // rank title with CSS class for color
  let title = document.getElementById("levelTitle");
  let rankName, rankClass;

  if (xp < 50)       { rankName = "Beginner 🐣";  rankClass = "rank-beginner"; }
  else if (xp < 100) { rankName = "Grinding 🔥";  rankClass = "rank-grinding"; }
  else if (xp < 300) { rankName = "Builder 🛠️";   rankClass = "rank-builder";  }
  else if (xp < 500) { rankName = "Elite ⚡";      rankClass = "rank-elite";    }
  else               { rankName = "Legend 👑";     rankClass = "rank-legend";   }

  title.innerText = "🏆 Rank: " + rankName;
  title.className = rankClass; // replaces old class cleanly
}

// ============================================================
//  MISSED DAYS COUNT
// ============================================================
function getMissedDays() {
  let completed = getJSON("completedDays", {});
  let total = getDayCount();
  let missed = 0;
  for (let i = 1; i <= total; i++) {
    if (!completed[i]) missed++;
  }
  return missed;
}

// ============================================================
//  MOTIVATION MESSAGE
// ============================================================
function getMotivation(day) {
  if (day < 10)  return "Start strong 💪";
  if (day < 30)  return "You're building something real 🔥";
  if (day < 60)  return "Most people quit here ⚠️";
  if (day < 100) return "Elite zone 🚀";
  return "Legend status 🏆";
}

// ============================================================
//  MAIN UPDATE FUNCTION
//  FIX: removed duplicate `let stats` that caused JS crash
//  FIX: elements that already exist in HTML are updated, not recreated
// ============================================================
function updateMain() {
  let day = getDayCount();

  // header
  document.getElementById("dayTitle").innerText = `Day ${day} — Hello, my name is ${name}`;
  document.getElementById("gymNote").innerText = `Day ${gymDay} at the gym`;

  // last active
  let last = localStorage.getItem("lastActive");
  document.getElementById("lastActive").innerText = last
    ? "🕒 Last active: " + last
    : "🕒 No activity yet";

  // daily note or random quote
  let notes = getJSON("dailyNotes", {});
  let quotes = [
    "Trust the process 🔥",
    "No days off 💪",
    "Brick by brick 🧱",
    "Discipline over trends ⚡",
    "Slow motion better than no motion 🐢",
    "Consistency wins 👑"
  ];
  let randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById("discipline").innerText = notes[day] || randomQuote;

  // motivation
  document.getElementById("consistency").innerText = getMotivation(day);

  // coding hours
  let codingHours = Number(getNum("codingHours")).toFixed(2);
  document.getElementById("codingHoursDisplay").innerText =
    `⏱️ Total Coding Hours: ${codingHours}h`;

  // day completed status
  let completed = getJSON("completedDays", {});
  document.getElementById("dayStatus").innerText = completed[day]
    ? "✅ Day completed"
    : "⏳ Not completed yet";

  // days completed count
  document.getElementById("progressText").innerText =
    `📊 ${day} Days Completed 🔥`;

  // level
  document.getElementById("levelText").innerText = `🏆 Level: ${getLevel()}`;

  // recent activity
  let activities = getJSON("activities", []);
  document.getElementById("activityList").innerHTML =
    activities.slice(0, 5).map(a => `<li>${a}</li>`).join("");

  updateXP();
  updateGreeting();
  updateStreak(day);
  updateAchievements(day);
}

// ============================================================
//  MARK DAY COMPLETE
// ============================================================
function markDone() {
  let day = getDayCount();
  let completed = getJSON("completedDays", {});

  if (completed[day]) {
    showToast("Already completed today ✅");
    return;
  }

  completed[day] = true;

  let xp = getNum("xp");
  xp += 10;

  // level up alert
  if (xp % 100 === 0) {
    showToast("🎉 LEVEL UP! 🚀");
  }

  localStorage.setItem("xp", xp);
  localStorage.setItem("completedDays", JSON.stringify(completed));
  localStorage.setItem("lastActive", new Date().toLocaleString());

  // activity log
  let activities = getJSON("activities", []);
  activities.unshift(`⚡ +10 XP earned on Day ${day}`);
  localStorage.setItem("activities", JSON.stringify(activities));

  // XP gain flash
  let gain = document.getElementById("xpGain");
  gain.innerText = "+10 XP ⚡";
  gain.style.opacity = "1";
  setTimeout(() => { gain.style.opacity = "0"; }, 2000);

  showToast("⚡ +10 XP Earned!");
  updateMain();
}

// ============================================================
//  CODING HOURS
// ============================================================
function addCodingHour() {
  let hours = getNum("codingHours");
  hours++;
  localStorage.setItem("codingHours", hours);
  showToast("⏱️ +1 Coding Hour added!");
  updateMain();
}

// ============================================================
//  SESSION TIMER
//  FIX: removed alert("Start button Clicked") debug line
// ============================================================
function startSession() {
  if (timerInterval) return; // already running

  timerInterval = setInterval(() => {
    sessionSeconds++;

    let hrs  = Math.floor(sessionSeconds / 3600);
    let mins = Math.floor((sessionSeconds % 3600) / 60);
    let secs = sessionSeconds % 60;

    document.getElementById("sessionTimer").innerText =
      `${String(hrs).padStart(2, "0")}:` +
      `${String(mins).padStart(2, "0")}:` +
      `${String(secs).padStart(2, "0")}`;
  }, 1000);

  showToast("⏱️ Session started!");
}

function stopSession() {
  if (!timerInterval) return;

  clearInterval(timerInterval);
  timerInterval = null;

  let hoursSpent = sessionSeconds / 3600;
  let totalHours = getNum("codingHours");
  totalHours += hoursSpent;
  localStorage.setItem("codingHours", totalHours.toFixed(2));

  // log session to activity
  let activities = getJSON("activities", []);
  activities.unshift(`⏱ Session: ${(sessionSeconds / 60).toFixed(1)} mins`);
  localStorage.setItem("activities", JSON.stringify(activities));

  sessionSeconds = 0;
  document.getElementById("sessionTimer").innerText = "00:00:00";

  showToast("⏹ Session saved!");
  updateMain();
}

// ============================================================
//  LESSONS
// ============================================================
function updateLesson() {
  let text = prompt("Enter lesson:");
  if (!text) return;

  let lessons = getJSON("movieLessons", []);
  lessons.push(text);
  localStorage.setItem("movieLessons", JSON.stringify(lessons));
  showLessons();
}

function showLessons() {
  let lessons = getJSON("movieLessons", []);
  let box = document.getElementById("movie-lesson");
  box.innerHTML = "";

  if (lessons.length === 0) {
    box.innerHTML = "<li>No lessons yet — add one!</li>";
    return;
  }

  lessons.forEach((l, i) => {
    let li = document.createElement("li");
    li.textContent = l;
    li.style.cursor = "pointer";
    li.title = "Tap to delete";
    li.onclick = () => {
      lessons.splice(i, 1);
      localStorage.setItem("movieLessons", JSON.stringify(lessons));
      showLessons();
    };
    box.appendChild(li);
  });
}

function clearLessons() {
  if (!confirm("Clear all lessons?")) return;
  localStorage.setItem("movieLessons", JSON.stringify([]));
  showLessons();
}

// ============================================================
//  GYM
// ============================================================
function increaseGymDay() {
  gymDay++;
  localStorage.setItem("gymDay", gymDay);
  showToast("💪 Gym day updated!");
  updateMain();
}

function resetGymDay() {
  if (!confirm("Reset gym days?")) return;
  gymDay = 1;
  localStorage.setItem("gymDay", gymDay);
  showToast("Gym reset to Day 1");
  updateMain();
}

// ============================================================
//  NAME
// ============================================================
function editName() {
  let newName = prompt("Enter your name:");
  if (!newName) return;
  name = newName;
  localStorage.setItem("name", newName);
  updateMain();
}

// ============================================================
//  NOTES
// ============================================================
function updateNote() {
  let day = getDayCount();
  let text = prompt("Enter note for today:");
  if (!text) return;

  let notes = getJSON("dailyNotes", {});
  notes[day] = text;
  localStorage.setItem("dailyNotes", JSON.stringify(notes));
  showToast("📝 Note saved!");
  updateMain();
}

function viewDay() {
  let d = prompt("Enter day number:");
  if (!d) return;

  let notes = getJSON("dailyNotes", {});
  let modal = document.getElementById("noteModal");
  let modalText = document.getElementById("modalText");

  modalText.innerText = notes[d] || `Day ${d}: No note yet`;
  modal.style.display = "block";
}

// ============================================================
//  CALENDAR
// ============================================================
function renderCalendar() {
  let container = document.getElementById("calendar");
  container.innerHTML = "";

  let completed = getJSON("completedDays", {});
  let today = getDayCount();

  for (let i = 1; i <= today; i++) {
    let box = document.createElement("span");
    box.innerText = i;
    box.style.cssText = "margin:3px; padding:8px; border-radius:6px; cursor:pointer; display:inline-block;";

    if (completed[i])  box.style.background = "#00aa44";
    else if (i < today) box.style.background = "#aa2222";
    else                box.style.background = "rgba(255,255,255,0.15)";

    // highlight today
    if (i === today) {
      box.style.border = "2px solid gold";
      box.style.boxShadow = "0 0 10px gold";
      setTimeout(() => {
        box.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }

    // click to view note
    box.onclick = () => {
      let notes = getJSON("dailyNotes", {});
      let modal = document.getElementById("noteModal");
      document.getElementById("modalText").innerText =
        notes[i] || `Day ${i}: No note yet`;
      modal.style.display = "block";
    };

    container.appendChild(box);
  }
}

// ============================================================
//  CHART
// ============================================================
function renderChart() {
  let ctx = document.getElementById("progressChart").getContext("2d");

  if (window.myChart) window.myChart.destroy();

  let labels = [];
  let data = [];
  let completed = getJSON("completedDays", {});
  let totalDays = getDayCount();
  let count = 0;

  for (let i = 1; i <= totalDays; i++) {
    labels.push(i);
    if (completed[i]) count++;
    data.push(count);
  }

  let gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "rgba(0, 200, 255, 0.6)");
  gradient.addColorStop(1, "rgba(0, 200, 255, 0)");

  window.myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Consistency",
        data,
        borderColor: "#00c8ff",
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#00c8ff"
      }]
    },
    options: {
      plugins: { legend: { labels: { color: "white" } } },
      scales: {
        x: { ticks: { color: "white" } },
        y: { ticks: { color: "white" } }
      }
    }
  });
}

// ============================================================
//  ACHIEVEMENTS
// ============================================================
function updateAchievements(day) {
  let box = document.getElementById("achievements-list");
  let streak = getNum("mainStreak");
  let xp = getNum("xp");
  let achievements = [];
  let morningCount = getNum("morningCount");
  let jogCount = getNum("jogCount");
  
  if (morningCount >= 7)  achievements.push("🌅 Early Bird - 7 Mornings");
  if (morningCount >= 21)  achievements.push("🔒 Habit Locked - 21 Mornings");
  if (morningCount >= 50)  achievements.push("👑 50 Morning Workouts");
  
  if (jogCount >= 7) achievements.push("🏃 First Week Runner - 7 Jogs");
  if (jogCount >= 30)  achievements.push("🔥 Road Warrior - 30 Jogs");
  if (jogCount >= 50)  achievements.push("👑 50 Jogs Beast");
  

  // day milestones
  if (day >= 7)   achievements.push("🟢 7 Days Discipline");
  if (day >= 30)  achievements.push("🔥 30 Days Consistency");
  if (day >= 60)  achievements.push("⚡ 60 Days Locked In");
  if (day >= 100) achievements.push("🏆 100 Days Elite");
  if (day >= 200) achievements.push("👑 200 Days Legend");

  // streak milestones
  if (streak >= 7)  achievements.push("💪 7 Day Streak");
  if (streak >= 30) achievements.push("🚀 30 Day Streak Beast");

  // xp milestones
  if (xp >= 50)  achievements.push("🔥 50 XP Grinder");
  if (xp >= 100) achievements.push("⚡ 100 XP Unlocked");
  if (xp >= 300) achievements.push("🛠️ Builder Rank");
  if (xp >= 500) achievements.push("👑 Legend Rank");

  box.innerHTML = achievements.length
    ? achievements.map(a => `<li style="margin-bottom:8px;">${a}</li>`).join("")
    : "<li>Function is runner</li>";
}

// ============================================================
//  POPUPS & TOASTS
// ============================================================
function showAchievementPopup(text) {
  let popup = document.getElementById("achievementPopup");
  document.getElementById("achievementText").innerText = text;
  popup.classList.add("show");
  setTimeout(() => popup.classList.remove("show"), 3000);
}

function showToast(message) {
  let toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ============================================================
//  HELP MODAL
// ============================================================
function showHelp() {
  let modalText = document.getElementById("modalText");
  modalText.innerText = `
Welcome to Dev Tracker v2 🚀

• Mark Day Complete after coding each day
• Each day gives +10 XP ⚡
• Build your streak by showing up daily 🔥
• Use the timer to track session time
• Calendar shows green (done) / red (missed)
• Lessons tab = store what you learn

Simple rule: Show up every day.
  `;
  document.getElementById("noteModal").style.display = "block";
}

// ============================================================
//  MODAL CLOSE
// ============================================================
document.getElementById("closeModal").onclick = () => {
  document.getElementById("noteModal").style.display = "none";
};

window.onclick = (e) => {
  let modal = document.getElementById("noteModal");
  if (e.target === modal) modal.style.display = "none";
};

// ============================================================
//  BACKUP & RESTORE
//  NEW: was missing from v2 JS but buttons exist in v1
// ============================================================
function backup() {
  // collect everything from localStorage into one object
  let data = {};
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      data[key] = localStorage.getItem(key);
    }
  }

  // turn it into a downloadable JSON file
  let blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "devtracker-backup.json";
  a.click();
  URL.revokeObjectURL(url);
  showToast("💾 Backup downloaded!");
}

function restore() {
  let input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = (e) => {
    let file = e.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = (ev) => {
      try {
        let data = JSON.parse(ev.target.result);
        // restore each key back to localStorage
        for (let key in data) {
          localStorage.setItem(key, data[key]);
        }
        showToast("✅ Data restored!");
        location.reload();
      } catch {
        showToast("❌ Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  input.click();
}

function logMorning() {
  
  let today = new Date().toDateString();
  let lastMorning = localStorage.getItem("lastMorningDate");

  if (lastMorning === today) {
    showToast("✅ Morning already logged today!");
    return;
  }

  localStorage.setItem("lastMorningDate", today);

  let count = getNum("morningCount") + 1;
  localStorage.setItem("morningCount", count);
  showToast("🌅 Morning logged! Day " + count);
  checkMilestoneMorning(count);
  updateMain();
}

function logJog() {

  let today = new Date().toDateString();
  let lastJog = localStorage.getItem("lastJogDate");

  if (lastJog === today) {
    showToast("✅ Jog already logged today!");
    return;
  }

  localStorage.setItem("lastJogDate", today);

  let count = getNum("jogCount") + 1;
  localStorage.setItem("jogCount", count);
  showToast("🏃 Jog logged! Day " + count);
  checkMilestoneJog(count);
  updateMain();
}


// ============================================================
//  FILL PAST DAYS (utility)
// ============================================================
function fillPastDays() {
  let completed = {};
  let total = getDayCount();
  for (let i = 1; i <= total; i++) completed[i] = true;
  localStorage.setItem("completedDays", JSON.stringify(completed));
  showToast("All past days filled ✅");
  location.reload();
}

function loadSetting() {
  let photo = document.getElementById("settingPhoto");
  if (photo) {
    photo.src =
      localStorage.getItem("profilePhoto") ||
      "https://i.imgur.com/nyo0C7C.jpeg";
  }

  let name = localStorage.getItem("userName") || "Edeh Promise";
  let dayCount = getDayCount();

  let nameEl = document.getElementById("settingName");
  if (nameEl) nameEl.innerText = name;

  let dayEl = document.getElementById("settingDay");
  if (dayEl) dayEl.innerText = `Day ${dayCount} - Keep going 💪🏿`;

  let about = localStorage.getItem("aboutMe") ||
    "Tap Edit to write your story...";

  let aboutEl = document.getElementById("aboutText");
  if (aboutEl) aboutEl.innerText = about;
}

function editAbout() {
  let current = localStorage.getItem("aboutMe") || "";
  let text = prompt(`
My name is Edeh Promise.

I am a self-taught web developer from Nigeria who is learning and building projects using only a mobile phone.

I believe in consistency, discipline, and improving one day at a time.

This Dev Tracker is my personal project where I track my coding journey, daily habits, gym progress, jogging sessions, and growth as a developer.

My goal is to keep learning, build useful applications, and eventually work with people and clients around the world.

Day by day. Brick by brick.
`, current);
  if (!text) return;
  localStorage.setItem("aboutMe", text);
  document.getElementById("aboutText").innerText = text;
  showToast("✅ About Me saved!");
}

function changePhoto() {
  let url = prompt("Paste your Imgur image link:");
  if (!url) return;
  localStorage.setItem("profilePhoto", url);
  document.getElementById("settingsPhoto").src = url;
  let homePhoto = document.querySelector(".profile-img");
  if (homePhoto) homePhoto.src = url;
  showToast("🖼️ Photo updated!");
}


// ============================================================
//  INIT — runs once when page loads
// ============================================================
window.onload = () => {
  updateMain();
  showLessons();
  loadSetting();

  // add IDs to elements that updateMain() needs
  // these already exist in your HTML from the upgraded index.html
};

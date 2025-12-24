const { invoke } = window.__TAURI__.core;

// --- User Settings Management ---
let userSettings = {
  volume: 0.5,
  global_shortcuts_enabled: true,
};

// --- App Configuration Constants ---
const CONFIG = {
  BATCH_SIZE: 5,
  PROGRESS_UPDATE_INTERVAL: 250,
  LOADER_HIDE_DELAY: 300,
  QUERY_MODAL_OPEN_DELAY: 1900,
  LIGHTNING_CHANCE: 0.2,
  LIGHTNING_INTERVAL: 5000,
  SURPRISE_VIDEO_CHANCE: 0.05,
  VIDEO_UPDATE_INTERVAL: 3600000,
  TOAST_SHOW_DURATION: 1200,
  BIRTHDAY_MUSIC_DELAY: 5000,
  CONFETTI_COUNT: 50,
  CONFETTI_DURATION: 8000,
  DEFAULT_IMAGES: [
    "assets/bg1.jpeg",
    "assets/bg2.jpeg",
    "assets/bg3.jpeg",
    "assets/bg4.jpeg",
  ],
  RAIN_VIDEOS: ["videos/rain1.mp4", "videos/rain2.mp4", "videos/rain3.mp4"],
  QUERY_MODAL_VIDEOS: [
    "videos/query-modal_1.mp4",
    "videos/query-modal_2.mp4",
    "videos/query-modal_3.mp4",
    "videos/query-modal_4.mp4",
  ],
  SURPRISE_VIDEOS: [
    "videos/surprise1.mp4",
    "videos/surprise2.mp4",
    "videos/WhispTune_Serenity.mp4",
  ],
  BIRTHDAY_IMAGES: [
    "assets/birthday1.jpg",
    "assets/birthday2.jpg",
    "assets/birthday3.jpg",
    "assets/birthday4.jpg",
    "assets/party.jpg",
  ],
  BIRTHDAY_LINKS: [
    "https://music.youtube.com/watch?v=44k30sHxiv8&si=H8xEsy9xP-NhXISv",
    "https://music.youtube.com/watch?v=JG8fTe9hamA&si=CRHkjNklCG0w7RXm",
    "https://music.youtube.com/watch?v=GczUEJql94k&si=GDN_Irm-09DGx8f_",
    "https://youtu.be/wSGoUSwNb44?si=VgC6VipDd3WA-ApC",
  ],
};

// Load settings on startup
async function loadUserSettings() {
  try {
    userSettings = await invoke("load_user_settings");
    console.log("Settings loaded:", userSettings);
    return userSettings;
  } catch (error) {
    console.error("Failed to load settings:", error);
    return userSettings;
  }
}

// Save settings
async function saveUserSettings() {
  try {
    await invoke("save_user_settings", { settings: userSettings });
    console.log("Settings saved:", userSettings);
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}
let saveTimeout = null;
function debouncedSaveSettings() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveUserSettings();
  }, 500);
}

// --- DOM Element References ---
const image = document.getElementById("cover");
const title = document.getElementById("music-title");
const artist = document.getElementById("music-artist");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const progress = document.getElementById("progress");
const playerProgress = document.getElementById("player-progress");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const playBtn = document.getElementById("play");
const background = document.getElementById("bg-img");
const loopShuffleBtn = document.getElementById("loop-shuffle-btn");
const shuffleBtn = document.getElementById("shuffle-btn"); 

// Loader refs
const loaderEl = document.getElementById("global-loader");
const loaderTextEl = document.getElementById("loader-text");
let loaderRefCount = 0;
function showLoader(text = "Loading…") {
  loaderRefCount++;
  if (loaderTextEl && typeof text === "string") loaderTextEl.textContent = text;
  if (loaderEl) loaderEl.classList.remove("hidden");
}
function hideLoader() {
  loaderRefCount = Math.max(0, loaderRefCount - 1);
  if (loaderEl && loaderRefCount === 0) loaderEl.classList.add("hidden");
}

// Disable right-click context menu everywhere in the app
window.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});

// Prevent default behavior for dragover and drop events (to avoid opening files in the browser)
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());

// Block unwanted keyboard shortcuts (refresh, zoom, navigation)
window.addEventListener("keydown", function (e) {
  if (e.key === "F5" || (e.ctrlKey && e.key.toLowerCase() === "r")) {
    e.preventDefault();
    return;
  }
  if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
    e.preventDefault();
    return;
  }
  if (
    (e.ctrlKey && (e.key === "+" || e.key === "-" || e.key === "=")) ||
    e.key === "F11"
  ) {
    e.preventDefault();
  }
});

window.addEventListener(
  "wheel",
  function (e) {
    if (e.ctrlKey) e.preventDefault();
  },
  { passive: false }
);

(function setRandomDefaultImages() {
  const randomImg = randomFromArray(CONFIG.DEFAULT_IMAGES);
  const bgImg = document.getElementById("bg-img");
  const coverImg = document.getElementById("cover");
  if (bgImg) bgImg.src = randomImg;
  if (coverImg) coverImg.src = randomImg;
})();

function setTimeBasedVideo() {
  const now = new Date();
  const hour = now.getHours();
  const videoElement = document.querySelector(".button-video source");

  if (videoElement) {
    let videoSrc;

    if (hour >= 6 && hour < 12) {
      videoSrc = "videos/morning.mp4";
    }
    else if (hour >= 12 && hour < 15) {
      videoSrc = "videos/afternoon.mp4";
    }
    else if (hour >= 15 && hour < 18) {
      videoSrc = "videos/evening.mp4";
    }
    else {
      videoSrc = "videos/night.mp4";
    }
    if (Math.random() < CONFIG.SURPRISE_VIDEO_CHANCE) {
      videoSrc = randomFromArray(CONFIG.SURPRISE_VIDEOS);
      console.log("🎉 Surprise video activated!", videoSrc);
    }

    if (videoElement.src !== videoSrc) {
      videoElement.src = videoSrc;
      const video = videoElement.parentElement;
      video.load(); 
    }
  }
}
setTimeBasedVideo();
setInterval(setTimeBasedVideo, CONFIG.VIDEO_UPDATE_INTERVAL);
function showBirthdayInputDialog() {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,30,60,0.9) 100%);
      z-index: 10000;
      backdrop-filter: blur(10px);
      animation: fadeIn 0.3s ease;
    `;
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 50px 40px;
      border-radius: 25px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 10001;
      text-align: center;
      font-family: 'Segoe UI', Arial, sans-serif;
      border: 2px solid rgba(255,255,255,0.3);
      max-width: 450px;
      width: 90%;
      animation: slideIn 0.4s ease;
    `;

    modal.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translate(-50%, -60%);
          }
          to { 
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      </style>
      <div style="
        font-size: 60px;
        margin-bottom: 20px;
        animation: pulse 2s infinite;
      ">🎂</div>
      <h2 style="
        color: white;
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 15px 0;
        text-shadow: 0 2px 10px rgba(0,0,0,0.3);
      ">Welcome to WhispTune!</h2>
      <p style="
        color: rgba(255,255,255,0.95);
        font-size: 16px;
        margin: 0 0 30px 0;
        line-height: 1.6;
        text-shadow: 0 1px 3px rgba(0,0,0,0.2);
      ">When's your birthday? 🎉<br>We'll add a little magic to your day!</p>
      
      <div style="
        display: flex;
        gap: 15px;
        justify-content: center;
        margin-bottom: 30px;
      ">
        <div style="flex: 1;">
          <label style="
            color: white;
            font-size: 14px;
            font-weight: 600;
            display: block;
            margin-bottom: 8px;
            text-align: left;
          ">Month</label>
          <select id="birth-month" style="
            width: 100%;
            padding: 12px;
            font-size: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 12px;
            background: rgba(255,255,255,0.95);
            color: #333;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            <option value="">Select</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>
        <div style="flex: 1;">
          <label style="
            color: white;
            font-size: 14px;
            font-weight: 600;
            display: block;
            margin-bottom: 8px;
            text-align: left;
          ">Day</label>
          <select id="birth-day" style="
            width: 100%;
            padding: 12px;
            font-size: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 12px;
            background: rgba(255,255,255,0.95);
            color: #333;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            <option value="">Select</option>
            ${Array.from(
              { length: 31 },
              (_, i) => `<option value="${i + 1}">${i + 1}</option>`
            ).join("")}
          </select>
        </div>
      </div>
      
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button id="save-birthday-btn" style="
          padding: 14px 32px;
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 700;
          font-size: 16px;
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
          transition: all 0.3s ease;
          flex: 1;
        ">Save 🎁</button>
        <button id="skip-birthday-btn" style="
          padding: 14px 32px;
          background: rgba(255,255,255,0.2);
          color: white;
          border: 2px solid rgba(255,255,255,0.5);
          border-radius: 50px;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          flex: 1;
        ">Skip</button>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    const monthSelect = document.getElementById("birth-month");
    const daySelect = document.getElementById("birth-day");
    const saveBtn = document.getElementById("save-birthday-btn");
    const skipBtn = document.getElementById("skip-birthday-btn");
    saveBtn.onmouseover = () => {
      saveBtn.style.transform = "translateY(-2px)";
      saveBtn.style.boxShadow = "0 8px 25px rgba(76, 175, 80, 0.6)";
    };
    saveBtn.onmouseout = () => {
      saveBtn.style.transform = "translateY(0)";
      saveBtn.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.4)";
    };

    skipBtn.onmouseover = () => {
      skipBtn.style.background = "rgba(255,255,255,0.3)";
      skipBtn.style.transform = "translateY(-2px)";
    };
    skipBtn.onmouseout = () => {
      skipBtn.style.background = "rgba(255,255,255,0.2)";
      skipBtn.style.transform = "translateY(0)";
    };
    monthSelect.onmouseover = () =>
      (monthSelect.style.borderColor = "rgba(255,255,255,0.6)");
    monthSelect.onmouseout = () =>
      (monthSelect.style.borderColor = "rgba(255,255,255,0.3)");
    daySelect.onmouseover = () =>
      (daySelect.style.borderColor = "rgba(255,255,255,0.6)");
    daySelect.onmouseout = () =>
      (daySelect.style.borderColor = "rgba(255,255,255,0.3)");
    saveBtn.onclick = () => {
      const month = monthSelect.value;
      const day = daySelect.value;

      if (!month || !day) {
        modal.style.animation = "none";
        setTimeout(() => {
          modal.style.animation = "shake 0.5s ease";
          monthSelect.style.borderColor = "red";
          daySelect.style.borderColor = "red";
        }, 10);
        return;
      }

      const birthday = `${month}-${day}`;
      localStorage.setItem("userBirthday", birthday);
      console.log("🎂 Birthday saved:", birthday);
      modal.style.animation = "slideOut 0.3s ease forwards";
      backdrop.style.animation = "fadeOut 0.3s ease forwards";

      setTimeout(() => {
        document.body.removeChild(backdrop);
        document.body.removeChild(modal);
        resolve(birthday);
      }, 300);
    };
    skipBtn.onclick = () => {
      modal.style.animation = "slideOut 0.3s ease forwards";
      backdrop.style.animation = "fadeOut 0.3s ease forwards";

      setTimeout(() => {
        document.body.removeChild(backdrop);
        document.body.removeChild(modal);
        resolve(null);
      }, 300);
    };
    const style = document.createElement("style");
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translate(-50%, -50%); }
        25% { transform: translate(-48%, -50%); }
        75% { transform: translate(-52%, -50%); }
      }
      @keyframes slideOut {
        to { 
          opacity: 0;
          transform: translate(-50%, -40%);
        }
      }
      @keyframes fadeOut {
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  });
}

function checkBirthdayAndSurprise() {
  const storedBirthday = localStorage.getItem("userBirthday");
  const today = new Date();
  const todayString = `${today.getMonth() + 1}-${today.getDate()}`;

  if (!storedBirthday) {
    showBirthdayInputDialog();
    return;
  }
  if (storedBirthday === todayString) {
    triggerBirthdaySurprise();
  }
}

function triggerBirthdaySurprise() {
  console.log("🎉 IT'S YOUR BIRTHDAY! 🎉");
  const bgImg = document.getElementById("bg-img");
  const coverImg = document.getElementById("cover");
  const randomBirthdayImg = randomFromArray(CONFIG.BIRTHDAY_IMAGES);

  if (bgImg) bgImg.src = randomBirthdayImg;
  if (coverImg && !activePlaylist[activeIndex]?.cover) {
    coverImg.src = randomBirthdayImg;
  }
  const videoElement = document.querySelector(".button-video source");
  if (videoElement) {
    videoElement.src = "videos/birthday.mp4";
    const video = videoElement.parentElement;
    video.load();
  }
  createBirthdayConfetti();
  createBirthdayPhotoFrame();
  createBirthdayBadge();
  showBirthdayToast();
  document.title = "🎂 Happy Birthday! - WhispTune 🎉";
  localStorage.setItem("birthdayCelebratedToday", new Date().toDateString());
}

function createBirthdayConfetti() {
  const confettiContainer = document.createElement("div");
  confettiContainer.className = "birthday-confetti-container";
  confettiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 48%;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
    `;
  document.body.appendChild(confettiContainer);
  const confettiEmojis = ["🎉","🎊","🎂","🥳","🎈","🎁","✨","🌟","💖","🦄","🍰","🎵",];
  const colors = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
    "#ffeaa7",
    "#fd79a8",
  ];
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement("div");
    confetti.textContent =
      confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)];
    confetti.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 20 + 15}px;
            color: ${colors[Math.floor(Math.random() * colors.length)]};
            user-select: none;
            pointer-events: none;
        `;

    confettiContainer.appendChild(confetti);
    anime({
      targets: confetti,
      translateX: [
        { value: () => anime.random(-100, 100), duration: 1000 },
        { value: () => anime.random(-100, 100), duration: 1000 },
      ],
      translateY: [0, window.innerHeight + 100],
      rotate: () => anime.random(0, 360),
      scale: [
        { value: 1.2, duration: 300 },
        { value: 0.8, duration: 300 },
        { value: 0, duration: 400 },
      ],
      opacity: [1, 1, 0],
      duration: 4000,
      delay: i * 100,
      easing: "easeOutQuart",
      complete: () => confetti.remove(),
    });
  }
  setTimeout(() => {
    confettiContainer.remove();
  }, 8000);
}

function createBirthdayPhotoFrame() {
  const playerImg = document.querySelector(".player-img");
  if (!playerImg) return;
  playerImg.classList.add("birthday-frame");
  const sparkles = ["✨", "🌟", "💫", "⭐", "✨", "🌟"];
  sparkles.forEach((sparkle) => {
    const sparkleEl = document.createElement("span");
    sparkleEl.className = "birthday-sparkle";
    sparkleEl.textContent = sparkle;
    playerImg.appendChild(sparkleEl);
  });

  console.log("🖼️ Birthday photo frame applied!");
}

function createBirthdayBadge() {
  if (document.querySelector(".birthday-badge")) return;

  const badge = document.createElement("div");
  badge.className = "birthday-badge";
  badge.innerHTML = `
    <span class="birthday-badge-icon">🎂</span>
    <div class="birthday-badge-text">
      <span class="birthday-badge-title">Happy Birthday!</span>
      <span class="birthday-badge-subtitle">It's your special day 🎉</span>
    </div>
    <button class="birthday-badge-close" aria-label="Close badge">✕</button>
  `;
  document.body.appendChild(badge);
  const closeBtn = badge.querySelector(".birthday-badge-close");
  closeBtn.addEventListener("click", () => {
    badge.style.animation = "birthday-badge-exit 0.3s ease forwards";
    setTimeout(() => badge.remove(), 300);
  });

  if (!document.getElementById("birthday-badge-exit-style")) {
    const style = document.createElement("style");
    style.id = "birthday-badge-exit-style";
    style.textContent = `
      @keyframes birthday-badge-exit {
        0% { opacity: 1; transform: translateY(0) scale(1); }
        100% { opacity: 0; transform: translateY(-20px) scale(0.8); }
      }
    `;
    document.head.appendChild(style);
  }

  console.log("🏅 Birthday badge created!");
}

function showBirthdayToast() {
  const birthdayQuotes = [
    "Wishing you a day filled with happiness and a year filled with joy. Happy Birthday!",
    "May your special day be as amazing as you are. Happy Birthday!",
    "Another year older, another year wiser. Here's to a great one!",
    "Hope your birthday is full of music, laughter, and everything you love. 🎉",
    "On your birthday, may your playlist be epic and your year be even better!",
  ];
  const randomQuote =
    birthdayQuotes[Math.floor(Math.random() * birthdayQuotes.length)];
  const birthdayToast = document.createElement("div");
  birthdayToast.className = "birthday-toast";
  birthdayToast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <span style="font-size: 2rem;">🎂</span>
            <div>
                <div style="font-size: 1.3rem; font-weight: bold; color: #fff;">Happy Birthday!</div>
                <div style="font-size: 1rem; color: #ffeb3b;">${randomQuote}</div>
            </div>
        </div>
    `;

  birthdayToast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 45%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        backdrop-filter: blur(15px);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 20px;
        padding: 25px 40px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        opacity: 0;
        scale: 0.8;
    `;
  document.body.appendChild(birthdayToast);
  anime({
    targets: birthdayToast,
    opacity: [0, 1],
    scale: [0.8, 1.1, 1],
    duration: 800,
    easing: "easeOutElastic(1, .8)",
    complete: () => {
      setTimeout(() => {
        anime({
          targets: birthdayToast,
          opacity: [1, 0],
          scale: [1, 0.9],
          duration: 500,
          easing: "easeInQuart",
          complete: () => birthdayToast.remove(),
        });
      }, 20000);
    },
  });
}
checkBirthdayAndSurprise();
function scheduleBirthdayCheck() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 1, 0);

  const msUntilMidnight = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    checkBirthdayAndSurprise();
    scheduleBirthdayCheck();
  }, msUntilMidnight);
}

scheduleBirthdayCheck();

// --- Unified Playlist State ---
let activePlaylist = [];
let activeIndex = 0;
let songs = [];
// --- Player State Variables ---
let currentHowl = null; 
let isLoopOnce = false;
let isLoop = false; 
let isShuffle = false;
let shuffledIndices = [];
let shuffledPlaybackIndex = 0;
let showFallbackImage = false;
let blobUrls = []; 
let lightningInterval = null; 
let progressRAFId = null; 
let lastProgressUpdate = 0;
let seekTargetTime = null; 
let wasPlayingBeforeSeek = false; 

// --- Helper Functions ---

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function cleanupBlobUrls() {
  blobUrls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn("Failed to revoke blob URL:", error);
    }
  });
  blobUrls = [];
}

function capitalizeWords(str) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

function togglePlay() {
  if (!currentHowl) return;

  if (currentHowl.playing()) {
    currentHowl.pause();
    playBtn.src = "icons/play.svg";
    if (progressRAFId !== null) {
      cancelAnimationFrame(progressRAFId);
      progressRAFId = null;
    }
  } else {
    currentHowl.play();
    playBtn.src = "icons/pause.svg";
    if (progressRAFId === null) {
      progressRAFId = requestAnimationFrame(updateProgressBar);
    }
  }
}

function playMusic() {
  if (!currentHowl && songs.length > 0) {
    loadMusic(activePlaylist[activeIndex]);
  }
  if (currentHowl) {
    currentHowl.play();
    playBtn.src = "icons/pause.svg";
    if (progressRAFId === null) {
      progressRAFId = requestAnimationFrame(updateProgressBar);
    }
  }
}

function pauseMusic() {
  if (currentHowl) {
    currentHowl.pause();
    playBtn.src = "icons/play.svg";
  }
  if (progressRAFId !== null) {
    cancelAnimationFrame(progressRAFId);
    progressRAFId = null;
  }
}

function loadMusic(song = activePlaylist[activeIndex]) {
  if (currentHowl) {
    currentHowl.unload();
  }

  const isOnline = song.stream_url !== undefined;

  const songTitle = isOnline ? song.title : song.displayName;
  const songArtist = song.artist || "Unknown Artist";

  title.textContent = songTitle;
  artist.textContent = songArtist;

  if (isOnline) {
    if (song.thumbnail) {
      image.style.display = "";
      background.style.display = "";
      image.src = song.thumbnail;
      background.src = song.thumbnail;
    } else {
      setRandomAssetImage();
    }
  } else {
    updateAlbumArt();
  }

  updateMediaSession(song);

  const titleElement = document.getElementById("music-title");
  const words = songTitle.split(" ");
  if (words.length > 3 || songTitle.length > 20) {
    titleElement.innerHTML = `<span>${songTitle}</span>`;
    titleElement.classList.add("marquee-title");
  } else {
    titleElement.textContent = songTitle;
    titleElement.classList.remove("marquee-title");
  }

  currentHowl = new Howl({
    src: [isOnline ? song.stream_url : song.path],
    html5: true,
    format: [isOnline ? "m4a" : song.format],
    volume: userSettings.volume,
    onplay: () => {
      if (progressRAFId === null) {
        progressRAFId = requestAnimationFrame(updateProgressBar);
      }
      highlightCurrentSong();
    },
    onload: () => {
      durationEl.textContent = formatTime(currentHowl.duration());
    },
    onend: () => {
      if (isLoopOnce) {
        loadMusic(activePlaylist[activeIndex]);
        playMusic();
        return;
      }

      const isLastSong = isShuffle
        ? shuffledPlaybackIndex >= shuffledIndices.length - 1
        : activeIndex >= activePlaylist.length - 1;

      if (!isLastSong) {
        changeMusic(1);
      } else if (isLoop) {
        changeMusic(1); 
      } else {
        pauseMusic();
        playBtn.src = "icons/play.svg";
      }
    },
    onseek: () => {
      if (
        (wasPlayingBeforeSeek || currentHowl.playing()) &&
        progressRAFId === null
      ) {
        progressRAFId = requestAnimationFrame(updateProgressBar);
      }
      wasPlayingBeforeSeek = false;
    },
  });
}

function setRandomAssetImage() {
  const randomImageNumber = Math.floor(Math.random() * 18) + 1; 
  const randomImage = `assets/image${randomImageNumber}.jpg`; 
  image.src = randomImage;
  background.src = randomImage;
}

function changeMusic(direction) {
  if (activePlaylist.length === 0) {
    console.warn("No songs loaded to change music.");
    return;
  }

  if (isShuffle) {
    shuffledPlaybackIndex =
      (shuffledPlaybackIndex + direction + shuffledIndices.length) %
      shuffledIndices.length;
    activeIndex = shuffledIndices[shuffledPlaybackIndex];
  } else {
    activeIndex =
      (activeIndex + direction + activePlaylist.length) % activePlaylist.length;
  }

  loadMusic(activePlaylist[activeIndex]);
  playMusic();
  highlightCurrentSong();
}

function updateProgressBar() {
  if (!currentHowl) return;

  const duration = currentHowl.duration();
  if (!duration || isNaN(duration)) {
    progressRAFId = requestAnimationFrame(updateProgressBar);
    return;
  }

  let currentTime;
  if (seekTargetTime !== null) {
    currentTime = seekTargetTime;
    seekTargetTime = null;
  } else {
    currentTime = currentHowl.seek() || 0;
  }
  const now = performance.now();

  if (now - lastProgressUpdate >= CONFIG.PROGRESS_UPDATE_INTERVAL) {
    lastProgressUpdate = now;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;

    currentTimeEl.textContent = formatTime(currentTime);
    durationEl.textContent = formatTime(duration);
  }
  if (currentHowl.playing()) {
    progressRAFId = requestAnimationFrame(updateProgressBar);
  } else {
    progressRAFId = null;
  }
}

function setProgressBar(e) {
  if (!currentHowl) return;
  const width = playerProgress.clientWidth;
  const clickX = e.offsetX; 
  const duration = currentHowl.duration();
  const newTime = (clickX / width) * duration;
  wasPlayingBeforeSeek = currentHowl.playing();
  currentHowl.seek(newTime); 
  seekTargetTime = newTime;
  const progressPercent = (newTime / duration) * 100;
  progress.style.width = `${progressPercent}%`;
  currentTimeEl.textContent = formatTime(newTime);
  lastProgressUpdate = 0;
}

function resetShuffleState() {
  if (isShuffle) {
    isShuffle = false;
    updateShuffleButton("shuffle-disabled.svg", true);
    shuffledIndices = [];
    shuffledPlaybackIndex = 0;
  }
}

function finalizeSongLoad() {
  songs.sort((a, b) => a.displayName.localeCompare(b.displayName));
  resetShuffleState();
  if (songs.length > 0) {
    activePlaylist = songs;
    activeIndex = 0;
    loadMusic(activePlaylist[activeIndex]);
    playMusic();
    updateSongList();
    highlightCurrentSong();
    console.log("Total songs loaded:", songs.length);
  } else {
    alert("No supported audio files found after processing.");
  }
}

function updateSongList() {
  const songListEl = document.getElementById("song-list");
  if (!songListEl) {
    console.warn("Song list element not found (ID: song-list).");
    return;
  }
  songListEl.innerHTML = "";

  activePlaylist.forEach((song, index) => {
    const li = document.createElement("li");
    li.textContent = song.displayName || `${song.title} - ${song.artist}`;
    li.style.cursor = "pointer";
    li.style.padding = "5px";
    li.classList.toggle("active", index === activeIndex);
    li.dataset.index = index; 

    li.addEventListener("click", () => {
      activeIndex = index;
      loadMusic(activePlaylist[activeIndex]);
      playMusic();
      highlightCurrentSong();
    });

    songListEl.appendChild(li);
  });
  console.log("Song list updated:", songListEl.children.length, "items");
}

function highlightCurrentSong() {
  const songListEl = document.getElementById("song-list");
  if (!songListEl) return;
  Array.from(songListEl.children).forEach((li, index) => {
    li.classList.toggle("active", index === activeIndex);
  });
}

document.getElementById("menu-toggle").addEventListener("change", function () {
  const songListEl = document.getElementById("song-list");
  if (songListEl) {
    if (this.checked) {
      songListEl.classList.add("show");
      console.log("Song list shown");
    } else {
      songListEl.classList.remove("show");
      console.log("Song list hidden");
    }
  }
});

function updateAlbumArt() {
  const song = activePlaylist[activeIndex];
  if (showFallbackImage || !song || !song.cover) {
    image.style.display = "";
    background.style.display = "";
    setRandomAssetImage();
  } else if (song.cover) {
    image.style.display = "";
    background.style.display = "";
    image.src = song.cover;
    background.src = song.cover;
  }
}

function toggleLoopMode() {
  if (!isLoopOnce && !isLoop) {
    isLoop = true; 
    isLoopOnce = false;
    updateLoopButton("repeat.svg", false); 
  } else if (isLoop) {
    isLoop = false;
    isLoopOnce = true; 
    updateLoopButton("repeat-1.svg", false);
  } else if (isLoopOnce) {
    isLoop = false;
    isLoopOnce = false;
    updateLoopButton("repeat-disabled.svg", true);
  }
  const loopBtn = document.getElementById("loop-shuffle-btn");
  const rect = loopBtn.getBoundingClientRect();
  const containerRect = document
    .querySelector(".container")
    .getBoundingClientRect();
  const x = rect.left - containerRect.left + rect.width / 2;
  const y = rect.top - containerRect.top + rect.height / 2;
  loopShuffleBurst(x, y);
}

function updateLoopButton(iconPath) {
  const icon = document.getElementById("loop-icon");
  if (icon) {
    icon.src = `icons/${iconPath}`;
    icon.classList.add("active");
  }
}

function updateShuffleButton(iconPath) {
  const icon = document.getElementById("shuffle-icon");
  if (icon) {
    icon.src = `icons/${iconPath}`;
    icon.classList.add("active");
  }
}

// Toggle Shuffle Mode
function toggleShuffle() {
  isShuffle = !isShuffle;
  updateShuffleButton(
    isShuffle ? "shuffle.svg" : "shuffle-disabled.svg",
    !isShuffle
  );

  if (isShuffle && activePlaylist.length > 0) {
    const currentSongIndex = activeIndex;
    const indices = Array.from(activePlaylist.keys());
    indices.splice(indices.indexOf(currentSongIndex), 1);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    shuffledIndices = [currentSongIndex, ...indices];
    shuffledPlaybackIndex = 0; 
  } else {
    shuffledIndices = [];
  }

  const shuffleBtnEl = document.getElementById("shuffle-btn");
  const rect = shuffleBtnEl.getBoundingClientRect();
  const containerRect = document
    .querySelector(".container")
    .getBoundingClientRect();
  const x = rect.left - containerRect.left + rect.width / 2;
  const y = rect.top - containerRect.top + rect.height / 2;
  loopShuffleBurst(x, y);
}

updateShuffleButton("shuffle-disabled.svg", false);

function loopShuffleBurst(centerX, centerY) {
  const glyphs = ["🦁","🌲","❄️","🕯️","✨","🍃","🌌","⛅","🌀","🦢","🎶",];
  const burstContainer = document.getElementById("loop-burst");
  burstContainer.innerHTML = "";
  burstContainer.classList.remove("hidden");
  burstContainer.style.top = `${centerY}px`;
  burstContainer.style.left = `${centerX}px`;

  for (let i = 0; i < 10; i++) {
    const particle = document.createElement("div");
    particle.className = "loop-particle";
    particle.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    burstContainer.appendChild(particle);

    const angle = Math.random() * 2 * Math.PI;
    const distance = 40 + Math.random() * 30;

    anime({
      targets: particle,
      translateX: Math.cos(angle) * distance,
      translateY: Math.sin(angle) * distance,
      scale: [1.2, 0.4],
      opacity: [1, 0],
      duration: 800 + Math.random() * 400,
      easing: "easeOutExpo",
      complete: () => particle.remove(),
    });
  }

  setTimeout(() => burstContainer.classList.add("hidden"), 1000);
}

// --- Tauri-Specific File Loading Logic ---

async function loadSongsFromFolderTauri() {
  console.log("Attempting to load songs from folder via Tauri...");
  showLoader("Importing songs…");
  try {
    cleanupBlobUrls();

    const filePaths = await invoke("select_and_list_audio_files");

    if (!filePaths || filePaths.length === 0) {
      console.log("No files selected or found by Rust backend.");
      alert(
        "No supported audio files found in the selected folder, or selection was cancelled."
      );
      songs = [];
      updateSongList();
      pauseMusic();
      return;
    }

    console.log("Received file paths from Rust:", filePaths);

    songs = [];
    let processed = 0;

    for (let i = 0; i < filePaths.length; i += CONFIG.BATCH_SIZE) {
      const batch = filePaths.slice(i, i + CONFIG.BATCH_SIZE);

      await Promise.all(
        batch.map(async (filePathData) => {
          try {
            const fileContentBytes = await invoke("read_file_content", {
              path: filePathData.path,
            });
            const blob = new Blob([new Uint8Array(fileContentBytes)], {
              type: `audio/${filePathData.extension}`,
            });
            const url = URL.createObjectURL(blob);
            blobUrls.push(url);

            await new Promise((resolve) => {
              window.jsmediatags.read(blob, {
                onSuccess: function (tag) {
                  let displayName =
                    tag.tags.title ||
                    capitalizeWords(
                      filePathData.file_name.replace(/\.[^/.]+$/, "")
                    );
                  let artistName = tag.tags.artist || "Unknown Artist";
                  let coverUrl = null;
                  if (tag.tags.picture) {
                    const { data, format } = tag.tags.picture;
                    let byteArray = new Uint8Array(data);
                    let coverBlob = new Blob([byteArray], { type: format });
                    coverUrl = URL.createObjectURL(coverBlob);
                    blobUrls.push(coverUrl);
                  }

                  songs.push({
                    path: url,
                    displayName,
                    artist: artistName,
                    format: filePathData.extension,
                    cover: coverUrl,
                  });
                  resolve();
                },
                onError: function () {
                  songs.push({
                    path: url,
                    displayName: capitalizeWords(
                      filePathData.file_name.replace(/\.[^/.]+$/, "")
                    ),

                    artist: "Unknown Artist",
                    format: filePathData.extension,
                    cover: null,
                  });
                  resolve();
                },
              });
            });
          } catch (error) {
            console.error(`Error processing file ${filePathData.path}:`, error);
          } finally {
            processed++;
            if (loaderTextEl)
              loaderTextEl.textContent = `Importing songs… (${processed}/${filePaths.length})`;
          }
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    finalizeSongLoad();
  } catch (error) {
    console.error("Error invoking Rust command or processing files:", error);
    alert(`Failed to load music: ${error.message}`);
  } finally {
    hideLoader();
  }
}

// Online playlist loader (unified)
async function loadPlaylist(query) {
  showLoader("Fetching tracks…");
  try {
    resetShuffleState();
    const result = await invoke("search_playlist_and_stream", {
      songName: query,
    });

    activePlaylist = result;
    songs = result;
    activeIndex = 0;

    updateSongList();

    if (activePlaylist.length > 0 && activePlaylist[activeIndex]) {
      loadMusic(activePlaylist[activeIndex]);
      playMusic();
    } else {
      console.warn("No songs returned from search_playlist_and_stream.");
      alert("No songs found for your search.");
    }
  } catch (err) {
    console.error("Playlist Search Failed:", err);
    alert("Online search failed. Please try again.");
  } finally {
    hideLoader();
  }
}

// --- Event Listeners ---

playBtn.addEventListener("click", togglePlay);
prevBtn.addEventListener("click", () => changeMusic(-1));
nextBtn.addEventListener("click", () => changeMusic(1));
playerProgress.addEventListener("click", setProgressBar);
document
  .getElementById("add-folder-btn")
  .addEventListener("click", loadSongsFromFolderTauri);

shuffleBtn.addEventListener("click", toggleShuffle);
loopShuffleBtn.addEventListener("click", toggleLoopMode);
function showVolumeToast(volume) {
  const toast = document.getElementById("volume-toast");
  const icon = toast.querySelector("img");
  const bar = document.getElementById("volume-bar");

  if (toast && icon && bar) {
    if (volume === 0) {
      icon.src = "icons/mute.svg";
      icon.alt = "Muted";
    } else if (volume > 0 && volume < 0.5) {
      icon.src = "icons/volume-low.svg";
      icon.alt = "Low Volume";
    } else {
      icon.src = "icons/volume.svg";
      icon.alt = "High Volume";
    }
    bar.style.width = `${Math.round(volume * 100)}%`;

    toast.style.display = "flex";
    if (toast._anime) toast._anime.pause();
    toast._anime = anime({
      targets: toast,
      opacity: [0, 1],
      scale: [0.98, 1.08, 1],
      translateY: [60, 0],
      easing: "easeOutElastic(1, .7)",
      duration: 500,
      begin: () => {
        toast.classList.add("show");
        toast.style.opacity = 0;
        toast.style.transform = "translate(-50%, 60px) scale(0.98)";
      },
    });

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      if (toast._anime) toast._anime.pause();
      toast._anime = anime({
        targets: toast,
        opacity: [1, 0],
        scale: [1, 0.96],
        translateY: [0, 60],
        easing: "easeInCubic",
        duration: 350,
        complete: () => {
          toast.classList.remove("show");
          toast.style.display = "none";
        },
      });
    }, 1200);
  }
}

// Keyboard controls
document.addEventListener("keydown", (e) => {
  const ae = document.activeElement;
  const isTyping =
    ae &&
    (ae.tagName === "INPUT" ||
      ae.tagName === "TEXTAREA" ||
      ae.isContentEditable);
  const qm = document.getElementById("query-modal");
  const isQueryModalOpen = qm && !qm.classList.contains("hidden");
  if (isTyping || isQueryModalOpen) return;

  if (e.code === "Space") {
    e.preventDefault();
    togglePlay();
  } else if (e.code === "ArrowLeft") {
    if (currentHowl && currentHowl.playing()) {
      const currentTime = currentHowl.seek();
      if (currentTime > 2) {
        currentHowl.seek(0);
        currentHowl.play();
      } else {
        changeMusic(-1);
      }
    } else {
      changeMusic(-1);
    }
  } else if (e.code === "ArrowRight") {
    changeMusic(1);
  } else if (e.code === "ArrowUp") {
    if (currentHowl) {
      const newVol = Math.min(currentHowl.volume() + 0.1, 1);
      currentHowl.volume(newVol);
      userSettings.volume = newVol;
      debouncedSaveSettings();
      showVolumeToast(newVol);
    }
  } else if (e.code === "ArrowDown") {
    if (currentHowl) {
      const newVol = Math.max(currentHowl.volume() - 0.1, 0);
      currentHowl.volume(newVol);
      userSettings.volume = newVol;
      debouncedSaveSettings();
      showVolumeToast(newVol);
    }
  } else if (e.key === "f" || e.key === "F") {
    showFallbackImage = !showFallbackImage;
    updateAlbumArt();
  }
});

function updateMediaSession(song) {
  if ("mediaSession" in navigator && song) {
    let artworkUrl = song.cover || song.thumbnail || "";
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: song.displayName || song.title,
      artist: song.artist,
      album: "",
      artwork: artworkUrl
        ? [{ src: artworkUrl, sizes: "512x512", type: "image/png" }]
        : [],
    });

    navigator.mediaSession.setActionHandler("play", playMusic);
    navigator.mediaSession.setActionHandler("pause", pauseMusic);
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      changeMusic(-1)
    );
    navigator.mediaSession.setActionHandler("nexttrack", () => changeMusic(1));
  }
}

// Online mode Codes
(function initQueryModal() {
  const modal = document.getElementById("query-modal");
  const input = document.getElementById("query-input");
  const btnOk = document.getElementById("query-ok");
  const btnCancel = document.getElementById("query-cancel");
  const bgVideo = modal ? modal.querySelector("video") : null;

  function pickRandomQueryVideo() {
    return randomFromArray(CONFIG.QUERY_MODAL_VIDEOS);
  }

  function openModal(prefill = "") {
    if (!modal) return;
    modal.classList.remove("hidden");
    if (bgVideo) {
      const newSrc = pickRandomQueryVideo();
      const sourceEl = bgVideo.querySelector("source");
      if (sourceEl && sourceEl.getAttribute("src") !== newSrc) {
        sourceEl.setAttribute("src", newSrc);
        try {
          bgVideo.load();
        } catch (_) {}
      }
      try {
        bgVideo.currentTime = 0;
        bgVideo.play().catch(() => {});
      } catch (_) {}
    }
    if (typeof prefill === "string") input.value = prefill;
    else input.value = "";
    setTimeout(() => input.focus(), 0);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add("hidden");
    if (bgVideo) {
      try {
        bgVideo.pause();
      } catch (_) {}
    }
  }

  async function submitQuery() {
    const q = input.value.trim();
    if (!q) {
      input.focus();
      return;
    }
    closeModal();
    await loadPlaylist(q);
  }

  if (btnOk) btnOk.addEventListener("click", submitQuery);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);
  if (modal)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  if (input)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitQuery();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
      }
    });

  document.addEventListener("keydown", async (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "o") {
      e.preventDefault();
      const x = e.clientX || window.innerWidth / 2;
      const y = e.clientY || window.innerHeight / 2;
      magicalBurst(x, y);

      const burst = document.getElementById("secret-burst");
      const label = document.getElementById("secret-label");
      burst.innerHTML = "";
      burst.classList.remove("hidden");
      label.classList.remove("hidden");

      const glyphs = ["🦁", "❄️", "🌌", "🕯️", "🍃", "🌲", "🦢", "🌠"];
      const numParticles = 18;
      for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement("div");
        particle.classList.add("burst-particle");
        particle.textContent =
          glyphs[Math.floor(Math.random() * glyphs.length)];
        burst.appendChild(particle);

        const angle = Math.random() * 2 * Math.PI;
        const radius = 80 + Math.random() * 60;
        anime({
          targets: particle,
          translateX: Math.cos(angle) * radius,
          translateY: Math.sin(angle) * radius,
          opacity: [1, 0],
          scale: () => anime.random(1, 2),
          duration: 1300 + Math.random() * 500,
          easing: "easeOutExpo",
          complete: () => particle.remove(),
        });
      }
      anime({
        targets: "#secret-label",
        opacity: [0, 1, 0],
        translateY: [-20, 0, -10],
        duration: 2400,
        easing: "easeInOutQuad",
      });
      await new Promise((res) =>
        setTimeout(res, CONFIG.QUERY_MODAL_OPEN_DELAY)
      );
      burst.classList.add("hidden");
      label.classList.add("hidden");
      openModal("");
    }
  });
})();

function magicalBurst(x, y) {
  const particles = [];
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement("div");
    particle.classList.add("magic-particle");
    document.body.appendChild(particle);

    const size = Math.random() * 8 + 8;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    particles.push(particle);
  }

  anime({
    targets: particles,
    translateX: () => anime.random(-100, 100),
    translateY: () => anime.random(-100, 100),
    scale: () => anime.random(1, 2),
    opacity: [1, 0],
    easing: "easeOutExpo",
    duration: 1200,
    complete: () => particles.forEach((p) => p.remove()),
  });
}

// ====================== EASTER EGG PACK ======================

// --- Magical Rain Mode ---

let originalBodyBackground = "";

document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.key.toLowerCase() === "k") {
    document.documentElement.classList.toggle("rain-mode");
    const isRainActive =
      document.documentElement.classList.contains("rain-mode");

    if (isRainActive) {
      originalBodyBackground = document.body.style.background;
      const randomVideo = randomFromArray(CONFIG.RAIN_VIDEOS);
      addRainVideoBackground(randomVideo);
    } else {
      removeRainVideoBackground();
      document.body.style.background = originalBodyBackground;
    }
  }
});

function addRainVideoBackground(videoPath) {
  if (!document.getElementById("rain-video")) {
    const video = document.createElement("video");
    video.id = "rain-video";
    video.src = videoPath;
    video.autoplay = true;
    video.loop = true;
    video.muted = false;
    video.volume = 0.3;
    video.style.position = "fixed";
    video.style.top = "0";
    video.style.left = "0";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.zIndex = "-1";
    video.style.opacity = "1";
    document.body.appendChild(video);
    document.body.style.background = "transparent";
  }
}
function removeRainVideoBackground() {
  const video = document.getElementById("rain-video");
  if (video) video.remove();
}

function triggerLightning() {
  const flash = document.createElement("div");
  flash.className = "lightning-flash";
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 500);
}
function initializeLightningInterval() {
  if (lightningInterval) {
    clearInterval(lightningInterval);
  }
  lightningInterval = setInterval(() => {
    if (document.documentElement.classList.contains("rain-mode")) {
      if (Math.random() < 0.2)
        triggerLightning();
    }
  }, 5000);
}
initializeLightningInterval();

// --- Comprehensive Cleanup Functions ---

function performCompleteCleanup() {
  console.log("Performing complete cleanup to prevent memory leaks...");
  cleanupBlobUrls();
  if (currentHowl) {
    currentHowl.unload();
    currentHowl = null;
  }
  const rainVideo = document.getElementById("rain-video");
  if (rainVideo) {
    rainVideo.pause();
    rainVideo.remove();
  }

  if (lightningInterval) {
    clearInterval(lightningInterval);
    lightningInterval = null;
  }

  const toast = document.getElementById("volume-toast");
  if (toast && toast._timeout) {
    clearTimeout(toast._timeout);
  }

  console.log("Cleanup completed successfully");
}

window.addEventListener("beforeunload", performCompleteCleanup);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (currentHowl && currentHowl.playing()) {
      currentHowl.pause();
    }
    const rainVideo = document.getElementById("rain-video");
    if (rainVideo && !rainVideo.paused) {
      rainVideo.pause();
    }
  }
});

(async function initializeApp() {
  try {
    await loadUserSettings();
    console.log("App initialized with settings:", userSettings);
  } catch (error) {
    console.error("Failed to initialize app:", error);
  }
})();


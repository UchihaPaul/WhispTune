// whisptune.js

const { invoke } = window.__TAURI__.core;

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
const loopShuffleBtn = document.getElementById("loop-shuffle-btn"); // Combined loop button
const shuffleBtn = document.getElementById("shuffle-btn"); // Separate shuffle button

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
window.addEventListener("keydown", function (e) {
  // Block F5, Ctrl+R, Ctrl+Shift+R, etc.
  if (
    e.key === "F5" ||
    (e.ctrlKey && e.key.toLowerCase() === "r") ||
    (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "r")
  ) {
    e.preventDefault();
  }
  // Block Back/Forward navigation
  if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
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
window.addEventListener("keydown", function (e) {
  if (
    (e.ctrlKey && (e.key === "+" || e.key === "-" || e.key === "=")) ||
    e.key === "F11"
  ) {
    e.preventDefault();
  }
});

// Set a random background and player image on app load
(function setRandomDefaultImages() {
  const images = [
    "assets/bg1.jpeg",
    "assets/bg2.jpeg",
    "assets/bg3.jpeg",
    "assets/bg4.jpeg",
  ];
  const randomIndex = Math.floor(Math.random() * images.length);
  const bgImg = document.getElementById("bg-img");
  const coverImg = document.getElementById("cover");
  if (bgImg) bgImg.src = images[randomIndex];
  if (coverImg) coverImg.src = images[randomIndex];
})();

// Function to set video based on time of day
// Function to set video based on time of day
function setTimeBasedVideo() {
  const now = new Date();
  const hour = now.getHours();
  const videoElement = document.querySelector(".button-video source");

  if (videoElement) {
    let videoSrc;

    // Morning: 6 AM - 11:59 AM
    if (hour >= 6 && hour < 12) {
      videoSrc = "videos/morning.mp4";
    }
    // Afternoon: 12 PM - 2:59 PM
    else if (hour >= 12 && hour < 15) {
      videoSrc = "videos/afternoon.mp4";
    }
    // Evening: 3 PM - 5:59 PM
    else if (hour >= 15 && hour < 18) {
      videoSrc = "videos/evening.mp4";
    }
    // Night: 6 PM - 5:59 AM
    else {
      videoSrc = "videos/night.mp4";
    }

    // 🎉 5% chance for a surprise video override!
    if (Math.random() < 0.05) {
      const surpriseVideos = [
        "videos/surprise1.mp4", //done
        "videos/surprise2.mp4", //done
        "videos/WhispTune_Serenity.mp4", // Your original as a surprise
        "videos/special.mp4", //done
      ];
      videoSrc =
        surpriseVideos[Math.floor(Math.random() * surpriseVideos.length)];
      console.log("🎉 Surprise video activated!", videoSrc);
    }

    // Only change if the source is different to avoid unnecessary reloads
    if (videoElement.src !== videoSrc) {
      videoElement.src = videoSrc;
      const video = videoElement.parentElement;
      video.load(); // Reload the video with new source
    }
  }
}

// Set initial video based on current time
setTimeBasedVideo();

// Update video every hour (3600000 ms = 1 hour)
setInterval(setTimeBasedVideo, 3600000);

// Add this after your existing setTimeBasedVideo function
function checkBirthdayAndSurprise() {
  // Get stored birthday from localStorage
  const storedBirthday = localStorage.getItem("userBirthday");
  const today = new Date();
  const todayString = `${today.getMonth() + 1}-${today.getDate()}`; // Format: MM-DD

  if (!storedBirthday) {
    // First time - ask for birthday
    const birthday = prompt(
      "🎂 When is your birthday? (MM-DD format, e.g., 03-15)"
    );
    if (birthday && birthday.match(/^\d{1,2}-\d{1,2}$/)) {
      localStorage.setItem("userBirthday", birthday);
      console.log("Birthday saved:", birthday);
    }
    return;
  }

  // Check if today is the user's birthday
  if (storedBirthday === todayString) {
    triggerBirthdaySurprise();
  }
}

function triggerBirthdaySurprise() {
  console.log("🎉 IT'S YOUR BIRTHDAY! 🎉");

  // 1. Special Birthday Background
  const bgImg = document.getElementById("bg-img");
  const coverImg = document.getElementById("cover");
  const birthdayImages = [
    "assets/birthday1.jpg",
    "assets/birthday2.jpg",
    "assets/birthday3.jpg",
    "assets/party.jpg",
  ];
  const randomBirthdayImg =
    birthdayImages[Math.floor(Math.random() * birthdayImages.length)];

  if (bgImg) bgImg.src = randomBirthdayImg;
  if (coverImg && !activePlaylist[activeIndex]?.cover) {
    coverImg.src = randomBirthdayImg;
  }

  // 2. Special Birthday Video for Add Music Button
  const videoElement = document.querySelector(".button-video source");
  if (videoElement) {
    videoElement.src = "videos/Adobe_birthday.mp4"; // Special birthday video
    const video = videoElement.parentElement;
    video.load();
  }

  // 3. Birthday Confetti Explosion
  createBirthdayConfetti();

  // 4. Birthday Audio Surprise

  // 5. Special Birthday Toast Message
  showBirthdayToast();

  // 7. Change page title for the day
  document.title = "🎂 Happy Birthday! - WhispTune 🎉";

  // 6. Automatic Birthday Playlist Search (if online)
  function showCustomConfirm(message) {
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.style.cssText = `
            position: fixed;
            top: 68%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 10001;
            text-align: center;
            font-family: 'Segoe UI', Arial, sans-serif;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        `;

      modal.innerHTML = `
            <div style="
                margin-bottom: 30px; 
                font-size: 22px; 
                color: white; 
                font-weight: 600;
                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">${message}</div>
            <div>
                <button id="confirm-yes" style="
                    margin: 0 10px; 
                    padding: 12px 24px; 
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); 
                    color: white; 
                    border: none; 
                    border-radius: 50px; 
                    cursor: pointer; 
                    font-weight: 600; 
                    font-size: 16px; 
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4); 
                    transition: all 0.3s ease; 
                    position: relative; 
                    overflow: hidden;
                ">Yes✨</button>
                <button id="confirm-no" style="
                    margin: 0 10px; 
                    padding: 12px 24px; 
                    background: linear-gradient(135deg, #f44336 0%, #da190b 100%); 
                    color: white; 
                    border: none; 
                    border-radius: 50px; 
                    cursor: pointer; 
                    font-weight: 600; 
                    font-size: 16px; 
                    box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4); 
                    transition: all 0.3s ease;
                ">No</button>
            </div>
        `;

      document.body.appendChild(modal);

      // Add hover effects
      const yesButton = document.getElementById("confirm-yes");
      const noButton = document.getElementById("confirm-no");

      yesButton.onmouseover = () => {
        yesButton.style.transform = "translateY(-2px)";
        yesButton.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.6)";
      };

      yesButton.onmouseout = () => {
        yesButton.style.transform = "translateY(0)";
        yesButton.style.boxShadow = "0 4px 15px rgba(76, 175, 80, 0.4)";
      };

      noButton.onmouseover = () => {
        noButton.style.transform = "translateY(-2px)";
        noButton.style.boxShadow = "0 6px 20px rgba(244, 67, 54, 0.6)";
      };

      noButton.onmouseout = () => {
        noButton.style.transform = "translateY(0)";
        noButton.style.boxShadow = "0 4px 15px rgba(244, 67, 54, 0.4)";
      };

      yesButton.onclick = () => {
        document.body.removeChild(modal);
        resolve(true);
      };

      noButton.onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
      };
    });
  }

  // Check if online before showing birthday prompt
  setTimeout(async () => {
    try {
      // Check if browser is online
      if (!navigator.onLine) {
        console.log("🚫 Offline: Birthday music prompt skipped");
        return;
      }

      // Additional check: Test actual connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      try {
        await fetch("https://www.google.com", {
          method: "HEAD",
          mode: "no-cors",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (networkError) {
        clearTimeout(timeoutId);
        console.log("🚫 No internet connection: Birthday music prompt skipped");
        return;
      }

      // If we reach here, we're online
      const shouldPlayBirthdayMusic = await showCustomConfirm(
        "🎵 Would you like me to play some birthday music for you?"
      );
      console.log("User response:", shouldPlayBirthdayMusic);

      if (shouldPlayBirthdayMusic === true) {
        const birthdayLinks = [
          "https://music.youtube.com/watch?v=44k30sHxiv8&si=H8xEsy9xP-NhXISv",
          "https://music.youtube.com/watch?v=JG8fTe9hamA&si=CRHkjNklCG0w7RXm",
          "https://music.youtube.com/watch?v=GczUEJql94k&si=GDN_Irm-09DGx8f_",
          "https://youtu.be/wSGoUSwNb44?si=VgC6VipDd3WA-ApC",
        ];
        const randomLink =
          birthdayLinks[Math.floor(Math.random() * birthdayLinks.length)];
        console.log("Selected birthday link:", randomLink);
        loadPlaylist(randomLink);
        console.log("🎶 loadPlaylist() called with:", randomLink);
      } else {
        console.log("❌ User said no. Skipping music.");
      }
    } catch (error) {
      console.log("Error handling user response:", error);
      console.log("❌ Error occurred. Skipping music.");
    }
  }, 5000);

  // 8. Store that we've celebrated today (prevent multiple triggers)
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

  const confettiEmojis = [
    "🎉",
    "🎊",
    "🎂",
    "🥳",
    "🎈",
    "🎁",
    "✨",
    "🌟",
    "💖",
    "🦄",
    "🍰",
    "🎵",
  ];
  const colors = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
    "#ffeaa7",
    "#fd79a8",
  ];

  // Create 50 confetti pieces
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

    // Animate confetti falling
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

  // Remove container after animation
  setTimeout(() => {
    confettiContainer.remove();
  }, 8000);
}

function showBirthdayToast() {
  // Array of special birthday quotes
  const birthdayQuotes = [
    "Wishing you a day filled with happiness and a year filled with joy. Happy Birthday!",
    "May your special day be as amazing as you are. Happy Birthday!",
    "Another year older, another year wiser. Here's to a great one!",
    "Hope your birthday is full of music, laughter, and everything you love. 🎉",
    "On your birthday, may your playlist be epic and your year be even better!",
  ];

  // Select a random quote
  const randomQuote =
    birthdayQuotes[Math.floor(Math.random() * birthdayQuotes.length)];

  // Create special birthday toast
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

  // Animate birthday toast
  anime({
    targets: birthdayToast,
    opacity: [0, 1],
    scale: [0.8, 1.1, 1],
    duration: 800,
    easing: "easeOutElastic(1, .8)",
    complete: () => {
      // Keep it visible for 6 seconds
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

// Check for birthday on app load
checkBirthdayAndSurprise();

// Check for birthday every day at midnight
function scheduleBirthdayCheck() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 1, 0); // 1 second after midnight

  const msUntilMidnight = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    checkBirthdayAndSurprise();
    scheduleBirthdayCheck(); // Schedule next check
  }, msUntilMidnight);
}

scheduleBirthdayCheck();

// Easter egg: Let users manually trigger birthday mode (for testing or fun)
document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "b") {
    console.log("Manual birthday mode triggered!");
    triggerBirthdaySurprise();
  }
});

// --- Unified Playlist State ---
let activePlaylist = [];
let activeIndex = 0;
let songs = [];
// --- Player State Variables ---
let currentHowl = null; // Store the current Howl instance
let isLoopOnce = false; // Track loop once state (repeat current song)
let isLoop = false; // Track loop all state (loop entire playlist)
let isShuffle = false; // Track shuffle state
let shuffledIndices = []; // Store shuffled playlist order
let shuffledPlaybackIndex = 0; // Current position in shuffled playlist
let showFallbackImage = false; // Add toggle for album art/fallback image
// night theme removed
let blobUrls = []; // Track blob URLs for cleanup
let lightningInterval = null; // Track lightning interval for cleanup

// --- Helper Functions ---

// Cleanup function to revoke blob URLs and prevent memory leaks
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

// Capitalize the first letter of each word in a string
function capitalizeWords(str) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Toggle play/pause state of the music
function togglePlay() {
  if (!currentHowl) return;

  if (currentHowl.playing()) {
    currentHowl.pause();
    playBtn.src = "icons/play.svg";
  } else {
    currentHowl.play();
    playBtn.src = "icons/pause.svg";
  }
}

// Play the current music
function playMusic() {
  if (!currentHowl && songs.length > 0) {
    loadMusic(activePlaylist[activeIndex]);
  }
  if (currentHowl) {
    currentHowl.play();
    document.getElementById("play").src = "icons/pause.svg";
  }
}

// Pause the current music
function pauseMusic() {
  if (currentHowl) {
    currentHowl.pause();
    document.getElementById("play").src = "icons/play.svg";
  }
}

// Load a song into the Howler.js player and update UI
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
    // Set cover and background to the online song's thumbnail
    if (song.thumbnail) {
      image.style.display = "";
      background.style.display = "";
      image.src = song.thumbnail;
      background.src = song.thumbnail;
    } else {
      // Fallback if no thumbnail
      setRandomAssetImage();
    }
  } else {
    // Local song logic (use album art or fallback)
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
    onplay: () => {
      updateProgressBar();
      highlightCurrentSong();
    },
    onload: () => {
      const duration = currentHowl.duration();
      const formatTime = (time) => String(Math.floor(time)).padStart(2, "0");
      durationEl.textContent = `${formatTime(duration / 60)}:${formatTime(
        duration % 60
      )}`;
    },
    onend: () => {
      if (isLoopOnce) {
        // Repeat the current song
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
        changeMusic(1); // This will loop back to the start of the (shuffled) playlist
      } else {
        // Stop playback at the end
        pauseMusic();
        playBtn.src = "icons/play.svg";
      }
    },
  });
}

// Set a random image from local assets as cover/background fallback
function setRandomAssetImage() {
  const randomImageNumber = Math.floor(Math.random() * 16) + 1; // Assuming 15 fallback images
  const randomImage = `assets/image${randomImageNumber}.jpg`; // Path to your local assets folder
  image.src = randomImage;
  background.src = randomImage;
}

// Change the current music index and load/play the new song (unified)
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

// Update the visual progress bar based on current playback time
function updateProgressBar() {
  if (!currentHowl) return;

  const duration = currentHowl.duration();
  if (!duration || isNaN(duration)) {
    requestAnimationFrame(updateProgressBar);
    return;
  }

  const currentTime = currentHowl.seek() || 0;
  const progressPercent = (currentTime / duration) * 100;
  progress.style.width = `${progressPercent}%`;

  const formatTime = (timeInSeconds) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  currentTimeEl.textContent = formatTime(currentTime);
  durationEl.textContent = formatTime(duration);

  // Only keep updating if the song is playing
  if (currentHowl.playing()) {
    requestAnimationFrame(updateProgressBar);
  }
}

// Set the current playback position based on click on the progress bar
function setProgressBar(e) {
  if (!currentHowl) return;

  const width = playerProgress.clientWidth; // Total width of the progress bar area
  const clickX = e.offsetX; // X-coordinate of the click relative to the progress bar
  const duration = currentHowl.duration(); // Total duration of the current song
  currentHowl.seek((clickX / width) * duration); // Set playback position
}

// Helper to reset shuffle state, e.g., when a new playlist is loaded
function resetShuffleState() {
  if (isShuffle) {
    isShuffle = false;
    updateShuffleButton("shuffle-disabled.svg", true);
    shuffledIndices = [];
    shuffledPlaybackIndex = 0;
  }
}

// Helper function to finalize UI update after all songs and their metadata are loaded
function finalizeSongLoad() {
  // Sort songs alphabetically by displayName for consistent order
  songs.sort((a, b) => a.displayName.localeCompare(b.displayName));
  resetShuffleState(); // Reset shuffle when new local songs are loaded
  if (songs.length > 0) {
    activePlaylist = songs;
    activeIndex = 0;
    loadMusic(activePlaylist[activeIndex]);
    playMusic();
    updateSongList(); // Populate the song list in the UI
    highlightCurrentSong();
    console.log("Total songs loaded:", songs.length);
  } else {
    alert("No supported audio files found after processing.");
  }
}

// Update the displayed list of songs in the UI (unified for both local and online)
function updateSongList() {
  const songListEl = document.getElementById("song-list");
  if (!songListEl) {
    console.warn("Song list element not found (ID: song-list).");
    return;
  }
  songListEl.innerHTML = "";
  let draggedIndex = null; // Variable to store the index of the dragged item

  activePlaylist.forEach((song, index) => {
    const li = document.createElement("li");
    li.textContent = song.displayName || `${song.title} - ${song.artist}`;
    li.style.cursor = "pointer";
    li.style.padding = "5px";
    li.classList.toggle("active", index === activeIndex);
    li.draggable = true; // Make the list item draggable
    li.dataset.index = index; // Store the index

    li.addEventListener("click", () => {
      activeIndex = index;
      loadMusic(activePlaylist[activeIndex]);
      playMusic();
      highlightCurrentSong();
    });

    // Drag and Drop event listeners
    li.addEventListener("dragstart", (e) => {
      const el = e.currentTarget;
      draggedIndex = parseInt(el.dataset.index);
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", draggedIndex.toString());
      } catch (_) {}
      setTimeout(() => el.classList.add("dragging"), 0);
    });

    li.addEventListener("dragend", (e) => {
      e.currentTarget.classList.remove("dragging");
      Array.from(songListEl.children).forEach((item) =>
        item.classList.remove("drag-over")
      );
      draggedIndex = null;
    });

    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
      const target = e.currentTarget;
      if (!target.classList.contains("drag-over")) {
        Array.from(songListEl.children).forEach((item) =>
          item.classList.remove("drag-over")
        );
        target.classList.add("drag-over");
      }
    });

    li.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.currentTarget;
      const droppedIndex = parseInt(target.dataset.index);
      target.classList.remove("drag-over");

      if (
        draggedIndex === null ||
        isNaN(droppedIndex) ||
        draggedIndex === droppedIndex
      )
        return;

      // Store current playing song to maintain playback
      const playingSong = activePlaylist[activeIndex];

      // Remove the dragged item and insert it at the new position
      const [movedSong] = activePlaylist.splice(draggedIndex, 1);
      activePlaylist.splice(droppedIndex, 0, movedSong);

      // Update activeIndex to point to the same song
      activeIndex = activePlaylist.indexOf(playingSong);

      // Update the UI
      updateSongList();
      highlightCurrentSong();
    });

    songListEl.appendChild(li);
  });
  console.log("Song list updated:", songListEl.children.length, "items");
}

// Highlight the currently playing song in the UI list (unified)
function highlightCurrentSong() {
  const songListEl = document.getElementById("song-list");
  if (!songListEl) return;
  Array.from(songListEl.children).forEach((li, index) => {
    li.classList.toggle("active", index === activeIndex);
  });
}

// Toggle visibility of the song list sidebar/panel
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

// Update the album art display (either actual cover, or random fallback)
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

// Toggle between loop modes (No Loop -> Loop All -> Loop Once)
function toggleLoopMode() {
  if (!isLoopOnce && !isLoop) {
    isLoop = true; // Enable Loop All
    isLoopOnce = false;
    updateLoopButton("repeat.svg", false); // No dimming
  } else if (isLoop) {
    isLoop = false;
    isLoopOnce = true; // Enable Loop Once
    updateLoopButton("repeat-1.svg", false); // No dimming
  } else if (isLoopOnce) {
    isLoop = false;
    isLoopOnce = false; // Disable Loop
    updateLoopButton("repeat-disabled.svg", true); // Dimmed
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

// Update loop button icon and active state
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
    !isShuffle // Dimmed if shuffle is off
  );

  if (isShuffle && activePlaylist.length > 0) {
    const currentSongIndex = activeIndex;
    const indices = Array.from(activePlaylist.keys());

    // Remove current song index from the list to be shuffled
    indices.splice(indices.indexOf(currentSongIndex), 1);

    // Fisher-Yates shuffle on the rest of the indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Add the current song's index back to the front of the shuffled list
    shuffledIndices = [currentSongIndex, ...indices];
    shuffledPlaybackIndex = 0; // Start at the beginning of the new shuffled list
  } else {
    // When turning shuffle off, activeIndex already points to the current song.
    // Just clear the shuffle data.
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

// Initialize shuffle button state on load
updateShuffleButton("shuffle-disabled.svg", false); // Start dimmed/off

// removed moon element (night theme)

function loopShuffleBurst(centerX, centerY) {
  const glyphs = [
    "🦁",
    "🌲",
    "❄️",
    "🕯️",
    "✨",
    "🍃",
    "🌌",
    "⛅",
    "🌀",
    "🦢",
    "🎶",
  ];
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

// Function to load songs from a folder using Tauri backend commands
async function loadSongsFromFolderTauri() {
  console.log("Attempting to load songs from folder via Tauri...");
  showLoader("Importing songs…");
  try {
    // Clean up previous blob URLs to prevent memory leaks
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

    await Promise.all(
      filePaths.map(async (filePathData) => {
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

// Attach the new Tauri-compatible function to your "Add Music" button
// Make sure this ID matches your HTML button ID for adding music (e.g., <button id="add-music-button">)
document
  .getElementById("add-folder-btn")
  .addEventListener("click", loadSongsFromFolderTauri);

shuffleBtn.addEventListener("click", toggleShuffle);
loopShuffleBtn.addEventListener("click", toggleLoopMode); // This button seems to handle all loop states

// Show volume toast message
function showVolumeToast(volume) {
  const toast = document.getElementById("volume-toast");
  const icon = toast.querySelector("img");
  const bar = document.getElementById("volume-bar");

  if (toast && icon && bar) {
    // Update icon based on volume
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
    // Update bar width
    bar.style.width = `${Math.round(volume * 100)}%`;

    toast.style.display = "flex";

    // Cancel any previous anime.js animations
    if (toast._anime) toast._anime.pause();

    // Animate in (pop up with bounce)
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

    // Hide after delay with fade/slide out
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
  // Don't hijack keys while the user is typing in an input/textarea/contentEditable
  // or while the query modal is open — allow spaces in the search box.
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
        // Restart the current song
        currentHowl.seek(0);
        currentHowl.play();
      } else {
        // Go to previous song
        changeMusic(-1);
      }
    } else {
      // Go to previous song if not playing
      changeMusic(-1);
    }
  } else if (e.code === "ArrowRight") {
    changeMusic(1);
  } else if (e.code === "ArrowUp") {
    if (currentHowl) {
      const newVol = Math.min(currentHowl.volume() + 0.1, 1);
      currentHowl.volume(newVol);
      showVolumeToast(newVol); // Show toast message
    }
  } else if (e.code === "ArrowDown") {
    if (currentHowl) {
      const newVol = Math.max(currentHowl.volume() - 0.1, 0);
      currentHowl.volume(newVol);
      showVolumeToast(newVol); // Show toast message
    }
  } else if (e.key === "f" || e.key === "F") {
    showFallbackImage = !showFallbackImage;
    updateAlbumArt(); // Toggle fallback image
  }
});

function updateMediaSession(song) {
  if ("mediaSession" in navigator && song) {
    let artworkUrl = song.cover || song.thumbnail || "";
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: song.displayName || song.title,
      artist: song.artist,
      album: "", // Optional
      artwork: artworkUrl
        ? [{ src: artworkUrl, sizes: "512x512", type: "image/png" }]
        : [],
    });

    // Optional: Handle media keys for play/pause/next/prev
    navigator.mediaSession.setActionHandler("play", playMusic);
    navigator.mediaSession.setActionHandler("pause", pauseMusic);
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      changeMusic(-1)
    );
    navigator.mediaSession.setActionHandler("nexttrack", () => changeMusic(1));
  }
}

// Online mode Codes
// Online mode: Ctrl+O opens a custom query modal with video background
(function initQueryModal() {
  const modal = document.getElementById("query-modal");
  const input = document.getElementById("query-input");
  const btnOk = document.getElementById("query-ok");
  const btnCancel = document.getElementById("query-cancel");
  const bgVideo = modal ? modal.querySelector("video") : null;
  // Pool of background videos for query modal; add more filenames to extend
  const queryModalVideos = [
    "videos/query-modal_1.mp4",
    "videos/query-modal_2.mp4",
    "videos/query-modal_3.mp4",
    "videos/query-modal_4.mp4",
  ];
  function pickRandomQueryVideo() {
    return queryModalVideos[
      Math.floor(Math.random() * queryModalVideos.length)
    ];
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
      // Allow normal typing, including spaces. Only intercept Enter/Escape.
      if (e.key === "Enter") {
        e.preventDefault();
        submitQuery();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
      }
    });

  // Delay (ms) before opening the query modal after Ctrl+O so the gateway label is visible
  const QUERY_MODAL_OPEN_DELAY = 1900; // adjust as desired ("a few seconds")

  document.addEventListener("keydown", async (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "o") {
      e.preventDefault();
      // keep the magical burst for flair
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
          scale: [1.4, 0.2],
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

      // Keep label visible for the configured delay, then hide and open modal
      await new Promise((res) => setTimeout(res, QUERY_MODAL_OPEN_DELAY));
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

// removed konami night theme logic

// --- Magical Rain Mode ---

let rainAudio = null;
let originalBodyBackground = ""; // Variable to store the original background style

document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.key.toLowerCase() === "k") {
    document.documentElement.classList.toggle("rain-mode");
    const isRainActive =
      document.documentElement.classList.contains("rain-mode");

    if (isRainActive) {
      // Store the original background before changing it
      originalBodyBackground = document.body.style.background;
      addRainVideoBackground(); // Call function to add video as background

      if (!rainAudio) {
        rainAudio = new Audio("effects/rain.mp3");
        rainAudio.loop = true;
        rainAudio.volume = 0.5;
        rainAudio.play();
      } else {
        rainAudio.play();
      }
    } else {
      removeRainVideoBackground(); // Call function to remove video background
      // Restore the original background
      document.body.style.background = originalBodyBackground;
      if (rainAudio) {
        // Check if rainAudio exists before pausing
        rainAudio.pause();
        // Clean up rain audio when not needed
        rainAudio.src = "";
        rainAudio.load();
        rainAudio = null;
      }
    }
  }
});

// Insert rain video as background when rain-mode activates
function addRainVideoBackground() {
  if (!document.getElementById("rain-video")) {
    const video = document.createElement("video");
    video.id = "rain-video";
    video.src = "videos/rain.mp4"; // From pexels.com User: Ambient_Nature_ Atmosphere
    video.autoplay = true;
    video.loop = true;
    video.muted = true; // Mute the video background as audio is handled separately
    video.style.position = "fixed";
    video.style.top = "0";
    video.style.left = "0";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.zIndex = "-1"; // Send it behind content
    video.style.opacity = "1"; // Make it fully visible
    document.body.appendChild(video);

    // Optionally, ensure body has no background or is transparent to show the video
    document.body.style.background = "transparent";
  }
}

// Remove rain video background when mode deactivates
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

// Initialize lightning interval properly to avoid memory leaks
function initializeLightningInterval() {
  if (lightningInterval) {
    clearInterval(lightningInterval);
  }
  lightningInterval = setInterval(() => {
    if (document.documentElement.classList.contains("rain-mode")) {
      if (Math.random() < 0.2)
        // occasional lightning
        triggerLightning();
    }
  }, 5000);
}

// Start the lightning interval
initializeLightningInterval();

// --- Comprehensive Cleanup Functions ---

// Master cleanup function to prevent memory leaks
function performCompleteCleanup() {
  console.log("Performing complete cleanup to prevent memory leaks...");

  // Clean up blob URLs
  cleanupBlobUrls();

  // Clean up Howl instance
  if (currentHowl) {
    currentHowl.unload();
    currentHowl = null;
  }

  // Clean up rain audio
  if (rainAudio) {
    rainAudio.pause();
    rainAudio.src = "";
    rainAudio.load();
    rainAudio = null;
  }

  // Clear lightning interval
  if (lightningInterval) {
    clearInterval(lightningInterval);
    lightningInterval = null;
  }

  // Clear any remaining timeouts (toast timeout)
  const toast = document.getElementById("volume-toast");
  if (toast && toast._timeout) {
    clearTimeout(toast._timeout);
  }

  // Remove dynamically created video elements
  const rainVideo = document.getElementById("rain-video");
  if (rainVideo) {
    rainVideo.remove();
  }

  console.log("Cleanup completed successfully");
}

// Add cleanup on page unload to prevent memory leaks
window.addEventListener("beforeunload", performCompleteCleanup);

// Add cleanup on visibility change (when tab becomes hidden)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Pause audio when tab is hidden to save resources
    if (currentHowl && currentHowl.playing()) {
      currentHowl.pause();
    }
    if (rainAudio && !rainAudio.paused) {
      rainAudio.pause();
    }
  }
});

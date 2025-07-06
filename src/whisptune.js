// whisptune.js

const { invoke } = window.__TAURI__.core;

// --- DOM Element References ---
const image = document.getElementById('cover');
const title = document.getElementById('music-title');
const artist = document.getElementById('music-artist');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const progress = document.getElementById('progress');
const playerProgress = document.getElementById('player-progress');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const playBtn = document.getElementById('play');
const background = document.getElementById('bg-img');
const loopShuffleBtn = document.getElementById('loop-shuffle-btn'); // Combined loop button
const shuffleBtn = document.getElementById('shuffle-btn'); // Separate shuffle button
 
// Disable right-click context menu everywhere in the app
window.addEventListener('contextmenu', function (e) {
  e.preventDefault();
});

window.addEventListener('contextmenu', e => e.preventDefault());

// Prevent default behavior for dragover and drop events (to avoid opening files in the browser)
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());
window.addEventListener('keydown', function(e) {
  // Block F5, Ctrl+R, Ctrl+Shift+R, etc.
  if (
    e.key === 'F5' ||
    (e.ctrlKey && e.key.toLowerCase() === 'r') ||
    (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r')
  ) {
    e.preventDefault();
  }
  // Block Back/Forward navigation
  if ((e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight'))) {
    e.preventDefault();
  }
});
window.addEventListener('wheel', function(e) {
  if (e.ctrlKey) e.preventDefault();
}, { passive: false });
window.addEventListener('keydown', function(e) {
  if ((e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=')) || e.key === 'F11') {
    e.preventDefault();
  }
});

// Set a random background and player image on app load
(function setRandomDefaultImages() {
    const images = [
        'assets/bg1.jpeg',
        'assets/bg2.jpeg',
        'assets/bg3.jpeg',
        'assets/bg4.jpeg'
    ];
    const randomIndex = Math.floor(Math.random() * images.length);
    const bgImg = document.getElementById('bg-img');
    const coverImg = document.getElementById('cover');
    if (bgImg) bgImg.src = images[randomIndex];
    if (coverImg) coverImg.src = images[randomIndex];
})();

// --- Unified Playlist State ---
let activePlaylist = [];
let activeIndex = 0;
let songs = [];
// --- Player State Variables ---
let currentHowl = null; // Store the current Howl instance
let isLoopOnce = false; // Track loop once state (repeat current song)
let isLoop = false; // Track loop all state (loop entire playlist)
let isShuffle = false; // Track shuffle state
let showFallbackImage = false; // Add toggle for album art/fallback image
let nightThemeActive = false; // State for Konami Code night theme

// --- Helper Functions ---

// Capitalize the first letter of each word in a string
function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

// Toggle play/pause state of the music
function togglePlay() {
  if (!currentHowl) return;

  if (currentHowl.playing()) {
    currentHowl.pause();
    playBtn.src = 'icons/play.svg';
  } else {
    currentHowl.play();
    playBtn.src = 'icons/pause.svg';
  }
}

// Play the current music
function playMusic() {
    if (!currentHowl && songs.length > 0) {
       loadMusic(activePlaylist[activeIndex]);

    }
    if (currentHowl) {
        currentHowl.play();
        document.getElementById('play').src = 'icons/pause.svg';
    }
}

// Pause the current music
function pauseMusic() {
    if (currentHowl) {
        currentHowl.pause();
        document.getElementById('play').src = 'icons/play.svg';
     }
}

// Load a song into the Howler.js player and update UI
function loadMusic(song = activePlaylist[activeIndex]) {
    if (currentHowl) {
        currentHowl.unload();
    }

    const isOnline = song.stream_url !== undefined;

    const songTitle = isOnline ? song.title : song.displayName;
    const songArtist = song.artist || 'Unknown Artist';

    title.textContent = songTitle;
    artist.textContent = songArtist;

    if (isOnline) {
        // Set cover and background to the online song's thumbnail
        if (song.thumbnail) {
            image.style.display = '';
            background.style.display = '';
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

    const titleElement = document.getElementById('music-title');
    const words = songTitle.split(' ');
    if (words.length > 3 || songTitle.length > 20) {
        titleElement.innerHTML = `<span>${songTitle}</span>`;
        titleElement.classList.add('marquee-title');
    } else {
        titleElement.textContent = songTitle;
        titleElement.classList.remove('marquee-title');
    }

    currentHowl = new Howl({
        src: [isOnline ? song.stream_url : song.path],
        html5: true,
        format: [isOnline ? 'm4a' : song.format],
        onplay: () => {
            updateProgressBar();
            highlightCurrentSong();
        },
        onload: () => {
            const duration = currentHowl.duration();
            const formatTime = (time) => String(Math.floor(time)).padStart(2, '0');
            durationEl.textContent = `${formatTime(duration / 60)}:${formatTime(duration % 60)}`;
        },
        onend: () => {
            if (isLoopOnce) {
                // Repeat the current song
                loadMusic(activePlaylist[activeIndex]);
                playMusic();
            } else if (activeIndex + 1 < activePlaylist.length) {
                // Go to next song
                activeIndex++;
                loadMusic(activePlaylist[activeIndex]);
                playMusic();
            } else if (isLoop) {
                // Loop the entire playlist
                activeIndex = 0;
                loadMusic(activePlaylist[activeIndex]);
                playMusic();
            } else {
                // Stop playback at the end
                pauseMusic();
                playBtn.src = 'icons/play.svg';
            }
        }
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
    if (isShuffle && direction !== 0) {
        activeIndex = Math.floor(Math.random() * activePlaylist.length);
    } else {
        activeIndex = (activeIndex + direction + activePlaylist.length) % activePlaylist.length;
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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

// Helper function to finalize UI update after all songs and their metadata are loaded
function finalizeSongLoad() {
    // Sort songs alphabetically by displayName for consistent order
    songs.sort((a, b) => a.displayName.localeCompare(b.displayName));
    if (songs.length > 0) {
        activePlaylist = songs;
        activeIndex = 0;
        loadMusic(activePlaylist[activeIndex]);
        playMusic();
        updateSongList(); // Populate the song list in the UI
        highlightCurrentSong();
        console.log('Total songs loaded:', songs.length);
    } else {
        alert('No supported audio files found after processing.');
    }
}

// Update the displayed list of songs in the UI (unified for both local and online)
function updateSongList() {
    const songListEl = document.getElementById('song-list');
    if (!songListEl) {
        console.warn("Song list element not found (ID: song-list).");
        return;
    }
    songListEl.innerHTML = '';
    activePlaylist.forEach((song, index) => {
        const li = document.createElement('li');
        li.textContent = song.displayName || `${song.title} - ${song.artist}`;
        li.style.cursor = 'pointer';
        li.style.padding = '5px';
        li.classList.toggle('active', index === activeIndex);
        li.addEventListener('click', () => {
            activeIndex = index;
            loadMusic(activePlaylist[activeIndex]);
            playMusic();
            highlightCurrentSong();
        });
        songListEl.appendChild(li);
    });
    console.log('Song list updated:', songListEl.children.length, 'items');
}

// Highlight the currently playing song in the UI list (unified)
function highlightCurrentSong() {
    const songListEl = document.getElementById('song-list');
    if (!songListEl) return;
    Array.from(songListEl.children).forEach((li, index) => {
        li.classList.toggle('active', index === activeIndex);
    });
}

// Toggle visibility of the song list sidebar/panel
document.getElementById('menu-toggle').addEventListener('change', function () {
    const songListEl = document.getElementById('song-list');
    if (songListEl) {
        if (this.checked) {
            songListEl.classList.add('show');
            console.log('Song list shown');
        } else {
            songListEl.classList.remove('show');
            console.log('Song list hidden');
        }
    }
});

// Update the album art display (either actual cover, or random fallback)
function updateAlbumArt() {
    const song = activePlaylist[activeIndex];

    if (nightThemeActive) {
        const nightImg = getRandomNightImage();
        image.style.display = '';
        background.style.display = '';
        image.src = nightImg;
        background.src = nightImg;
        return; // prevent override by album art
    }

    if (showFallbackImage || !song || !song.cover) {
        image.style.display = '';
        background.style.display = '';
        setRandomAssetImage();
    } else if (song.cover) {
        image.style.display = '';
        background.style.display = '';
        image.src = song.cover;
        background.src = song.cover;
    }
}

// Toggle between loop modes (No Loop -> Loop All -> Loop Once)
function toggleLoopMode() {
    if (!isLoopOnce && !isLoop) {
        isLoop = true; // Enable Loop All
        isLoopOnce = false;
        updateLoopButton('repeat.svg', false); // No dimming
    } else if (isLoop) {
        isLoop = false;
        isLoopOnce = true; // Enable Loop Once
        updateLoopButton('repeat-1.svg', false); // No dimming
    } else if (isLoopOnce) {
        isLoop = false;
        isLoopOnce = false; // Disable Loop
        updateLoopButton('repeat-disabled.svg', true); // Dimmed
    }
    const loopBtn = document.getElementById('loop-shuffle-btn');
    const rect = loopBtn.getBoundingClientRect();
    const containerRect = document.querySelector('.container').getBoundingClientRect();
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top + rect.height / 2;
    loopShuffleBurst(x, y);

}

// Update loop button icon and active state
function updateLoopButton(iconPath) {
    const icon = document.getElementById('loop-icon');
    if (icon) {
        icon.src = `icons/${iconPath}`;
        icon.classList.add('active');
    }
}

function updateShuffleButton(iconPath) {
    const icon = document.getElementById('shuffle-icon');
    if (icon) {
        icon.src = `icons/${iconPath}`;
        icon.classList.add('active');
    }
}

// Toggle Shuffle Mode
function toggleShuffle() {
    isShuffle = !isShuffle;
    updateShuffleButton(
        isShuffle ? 'shuffle.svg' : 'shuffle-disabled.svg',
        !isShuffle // Dimmed if shuffle is off
    );
    const shuffleBtnEl = document.getElementById('shuffle-btn');
    const rect = shuffleBtnEl.getBoundingClientRect();
    const containerRect = document.querySelector('.container').getBoundingClientRect();
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top + rect.height / 2;
    loopShuffleBurst(x, y);

}

// Initialize shuffle button state on load
updateShuffleButton('shuffle-disabled.svg', false); // Start dimmed/off

// Add moon element for night theme (hidden by default)
const moonDiv = document.createElement('div');
moonDiv.className = 'moon';
moonDiv.style.display = 'none'; // Hidden by default
const playerImgElement = document.querySelector('.player-img');
if (playerImgElement) {
    playerImgElement.prepend(moonDiv);
}

function loopShuffleBurst(centerX, centerY) {
  const glyphs = ['🦁', '🌲', '❄️', '🕯️', '✨', '🍃', '🌌', '⛅', '🌀', '🦢', '🎶'];
  const burstContainer = document.getElementById('loop-burst');
  burstContainer.innerHTML = '';
  burstContainer.classList.remove('hidden');
  burstContainer.style.top = `${centerY}px`;
  burstContainer.style.left = `${centerX}px`;

  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div');
    particle.className = 'loop-particle';
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
      easing: 'easeOutExpo',
      complete: () => particle.remove()
    });
  }

  setTimeout(() => burstContainer.classList.add('hidden'), 1000);
}


// --- Tauri-Specific File Loading Logic ---

// Function to load songs from a folder using Tauri backend commands
async function loadSongsFromFolderTauri() {
    console.log("Attempting to load songs from folder via Tauri...");
    try {
        // Call the Rust command to get file paths from the selected directory
        // `filePaths` will be an array of objects: [{ path: "...", file_name: "...", extension: "..." }, ...]
        const filePaths = await invoke('select_and_list_audio_files');

        if (!filePaths || filePaths.length === 0) {
            console.log("No files selected or found by Rust backend.");
            alert('No supported audio files found in the selected folder, or selection was cancelled.');
            songs = []; // Ensure songs array is empty
            updateSongList(); // Clear UI list
            pauseMusic(); // Stop playback
            return;
        }

        console.log("Received file paths from Rust:", filePaths);

        songs = []; // Reset the local songs array before populating
    
        // Use a Promise.all to wait for all files to be processed
        // This ensures `finalizeSongLoad` is called only after all metadata/blobs are ready
        await Promise.all(filePaths.map(async (filePathData) => {
            try {
                // Use a Rust command to read the file content as bytes
                const fileContentBytes = await invoke('read_file_content', { path: filePathData.path });

                // Convert bytes (Uint8Array) to a Blob object
                const blob = new Blob([new Uint8Array(fileContentBytes)], { type: `audio/${filePathData.extension}` });
                // Create a Blob URL for Howler.js to play this audio
                const url = URL.createObjectURL(blob);

                // Use jsmediatags to read metadata from the Blob
                await new Promise((resolve) => {
                    window.jsmediatags.read(blob, {
                        onSuccess: function(tag) {
                            let displayName = tag.tags.title || capitalizeWords(filePathData.file_name.replace(/\.[^/.]+$/, ''));
                            let artistName = tag.tags.artist || 'Unknown Artist';
                            let coverUrl = null;
                            if (tag.tags.picture) {
                                const { data, format } = tag.tags.picture;
                                let byteArray = new Uint8Array(data);
                                let coverBlob = new Blob([byteArray], { type: format });
                                coverUrl = URL.createObjectURL(coverBlob);
                            }

                            songs.push({
                                path: url, // This is the Blob URL for Howler.js
                                displayName: displayName,
                                artist: artistName,
                                format: filePathData.extension,
                                cover: coverUrl
                            });
                            resolve(); // Resolve the promise once tags are read
                        },
                        onError: function(error) {
                            console.warn(`Failed to read tags for ${filePathData.file_name}:`, error);
                            // Fallback if tags not found
                            songs.push({
                                path: url,
                                displayName: capitalizeWords(filePathData.file_name.replace(/\.[^/.]+$/, '')),
                                artist: 'Unknown Artist',
                                format: filePathData.extension,
                                cover: null
                            });
                            resolve(); // Resolve even on error so Promise.all completes
                        }
                    });
                });

            } catch (error) {
                console.error(`Error processing file ${filePathData.path}:`, error);
                // Even if one file fails, we want the overall process to continue
                // so we still resolve the promise for this file.
            }
        }));

        // After all files have been processed (Promise.all resolves)
        finalizeSongLoad();

    } catch (error) {
        console.error("Error invoking Rust command or processing files:", error);
        alert(`Failed to load music: ${error.message}`);
    }
}

// Online playlist loader (unified)
async function loadPlaylist(query) {
    try {
        const result = await invoke("search_playlist_and_stream", { songName: query });

        activePlaylist = result;
        songs = result; // Update the local songs array for consistency
        activeIndex = 0;

        updateSongList();

        // Defensive: Only call loadMusic if there is at least one song
        if (activePlaylist.length > 0 && activePlaylist[activeIndex]) {
            loadMusic(activePlaylist[activeIndex]);
            playMusic();
        } else {
            console.warn("No songs returned from search_playlist_and_stream.");
            alert("No songs found for your search.");
        }
    } catch (err) {
        console.error("Playlist Search Failed:", err);
    }
}

// --- Event Listeners ---

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => changeMusic(-1));
nextBtn.addEventListener('click', () => changeMusic(1));
playerProgress.addEventListener('click', setProgressBar);

// Attach the new Tauri-compatible function to your "Add Music" button
// Make sure this ID matches your HTML button ID for adding music (e.g., <button id="add-music-button">)
document.getElementById('add-folder-btn').addEventListener('click', loadSongsFromFolderTauri);

shuffleBtn.addEventListener('click', toggleShuffle);
loopShuffleBtn.addEventListener('click', toggleLoopMode); // This button seems to handle all loop states

// Show volume toast message
function showVolumeToast(volume) {
    const toast = document.getElementById('volume-toast');
    const icon = toast.querySelector('img');
    const bar = document.getElementById('volume-bar');

    if (toast && icon && bar) {
        // Update icon based on volume
        if (volume === 0) {
            icon.src = 'icons/mute.svg';
            icon.alt = 'Muted';
        } else if (volume > 0 && volume < 0.5) {
            icon.src = 'icons/volume-low.svg';
            icon.alt = 'Low Volume';
        } else {
            icon.src = 'icons/volume.svg';
            icon.alt = 'High Volume';
        }
        // Update bar width
        bar.style.width = `${Math.round(volume * 100)}%`;

        toast.style.display = 'flex';

        // Cancel any previous anime.js animations
        if (toast._anime) toast._anime.pause();

        // Animate in (pop up with bounce)
        toast._anime = anime({
            targets: toast,
            opacity: [0, 1],
            scale: [0.98, 1.08, 1],
            translateY: [60, 0],
            easing: 'easeOutElastic(1, .7)',
            duration: 500,
            begin: () => {
                toast.classList.add('show');
                toast.style.opacity = 0;
                toast.style.transform = 'translate(-50%, 60px) scale(0.98)';
            }
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
                easing: 'easeInCubic',
                duration: 350,
                complete: () => {
                    toast.classList.remove('show');
                    toast.style.display = 'none';
                }
            });
        }, 1200);
    }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
    } else if (e.code === 'ArrowLeft') {
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
    } else if (e.code === 'ArrowRight') {
        changeMusic(1);
    } else if (e.code === 'ArrowUp') {
        if (currentHowl) {
            const newVol = Math.min(currentHowl.volume() + 0.1, 1);
            currentHowl.volume(newVol);
            showVolumeToast(newVol); // Show toast message
        }
    } else if (e.code === 'ArrowDown') {
        if (currentHowl) {
            const newVol = Math.max(currentHowl.volume() - 0.1, 0);
            currentHowl.volume(newVol);
            showVolumeToast(newVol); // Show toast message
        }
    } else if (e.key === 'f' || e.key === 'F') {
        showFallbackImage = !showFallbackImage;
        updateAlbumArt(); // Toggle fallback image
    }
});

function updateMediaSession(song) {
    if ('mediaSession' in navigator && song) {
        let artworkUrl = song.cover || song.thumbnail || '';
        navigator.mediaSession.metadata = new window.MediaMetadata({
            title: song.displayName || song.title,
            artist: song.artist,
            album: '', // Optional
            artwork: artworkUrl ? [
                { src: artworkUrl, sizes: '512x512', type: 'image/png' }
            ] : []
        });

        // Optional: Handle media keys for play/pause/next/prev
        navigator.mediaSession.setActionHandler('play', playMusic);
        navigator.mediaSession.setActionHandler('pause', pauseMusic);
        navigator.mediaSession.setActionHandler('previoustrack', () => changeMusic(-1));
        navigator.mediaSession.setActionHandler('nexttrack', () => changeMusic(1));
    }
}

// Online mode Codes
document.addEventListener('keydown', async (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'o') {
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;

    magicalBurst(x, y);

    const burst = document.getElementById('secret-burst');
    const label = document.getElementById('secret-label');
    burst.innerHTML = '';
    burst.classList.remove('hidden');
    label.classList.remove('hidden');

    const glyphs = ['🦁', '❄️', '🌌', '🕯️', '🍃', '🌲', '🦢', '🌠'];
    const numParticles = 18;

    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement('div');
      particle.classList.add('burst-particle');
      particle.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
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
        easing: 'easeOutExpo',
        complete: () => particle.remove()
      });
    }

    anime({
      targets: '#secret-label',
      opacity: [0, 1, 0],
      translateY: [-20, 0, -10],
      duration: 2400,
      easing: 'easeInOutQuad'
    });

    await new Promise(res => setTimeout(res, 2200));
    burst.classList.add('hidden');
    label.classList.add('hidden');

    const query = prompt("🎧 Whisper your request to the Online Realm:");
    if (query) await loadPlaylist(query);
  }
});

function magicalBurst(x, y) {
  const particles = [];
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.classList.add('magic-particle');
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
    easing: 'easeOutExpo',
    duration: 1200,
    complete: () => particles.forEach(p => p.remove())
  });
}


// ====================== EASTER EGG PACK ======================

// --- Konami Code Easter Egg: Magical Night Theme ---
const konamiCode = [
"ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
"ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
"b", "a"
];
let konamiIndex = 0;

document.addEventListener('keydown', function(e) {
if (e.key === konamiCode[konamiIndex]) {
konamiIndex++;
if (konamiIndex === konamiCode.length) {
toggleNightTheme();
konamiIndex = 0; // Reset index after successful activation
}
} else {
konamiIndex = 0; // Reset if the sequence is broken
}
});

function getRandomNightImage() {
    const totalNightImages = 8; // Adjust to match the number of night images you have
    const index = Math.floor(Math.random() * totalNightImages) + 1;
    return `assets/night${index}.jpg`;
}

function toggleNightTheme() {
    nightThemeActive = !nightThemeActive;
    document.documentElement.classList.toggle('night-theme', nightThemeActive);

    const moon = document.querySelector('.moon');

    if (nightThemeActive) {
        image.style.display = 'none';
        background.style.display = 'none';

        // 🌙 30% chance moon appears
        if (Math.random() < 0.1) {
            if (moon) {
                const moonVariants = ['moon1.png', 'moon2.png', 'moon3.png'];
                const randomMoon = moonVariants[Math.floor(Math.random() * moonVariants.length)];
                moon.style.backgroundImage = `url('assets/${randomMoon}')`;
                moon.style.display = 'block';
            }
        } else {
            if (moon) moon.style.display = 'none';
        }

        const audio = new Audio('effects/shine.mp3');
        audio.volume = 0.5;
        audio.play();
        alert('✨ Magical Night Theme Activated! ✨');
    } else {
        image.style.display = '';
        background.style.display = '';
        if (moon) moon.style.display = 'none';
        updateAlbumArt();
    }
}

// --- Magical Rain Mode ---

let rainAudio = null;
let originalBodyBackground = ''; // Variable to store the original background style

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        document.documentElement.classList.toggle('rain-mode');
        const isRainActive = document.documentElement.classList.contains('rain-mode');

        if (isRainActive) {
            // Store the original background before changing it
            originalBodyBackground = document.body.style.background;
            addRainVideoBackground(); // Call function to add video as background

            if (!rainAudio) {
                rainAudio = new Audio('effects/rain.mp3');
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
            if (rainAudio) { // Check if rainAudio exists before pausing
                rainAudio.pause();
            }
        }
    }
});

// Insert rain video as background when rain-mode activates
function addRainVideoBackground() {
    if (!document.getElementById('rain-video')) {
        const video = document.createElement('video');
        video.id = 'rain-video';
        video.src = 'videos/rain.mp4'; // From pexels.com User: Ambient_Nature_ Atmosphere
        video.autoplay = true;
        video.loop = true;
        video.muted = true; // Mute the video background as audio is handled separately
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.zIndex = '-1'; // Send it behind content
        video.style.opacity = '1'; // Make it fully visible
        document.body.appendChild(video);

        // Optionally, ensure body has no background or is transparent to show the video
        document.body.style.background = 'transparent';
    }
}

// Remove rain video background when mode deactivates
function removeRainVideoBackground() {
    const video = document.getElementById('rain-video');
    if (video) video.remove();
}


function triggerLightning() {
    const flash = document.createElement('div');
    flash.className = 'lightning-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
}

setInterval(() => {
    if (document.documentElement.classList.contains('rain-mode')) {
        if (Math.random() < 0.2) // occasional lightning
            triggerLightning();
    }
}, 5000);
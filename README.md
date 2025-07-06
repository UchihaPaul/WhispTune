
# 🎶WhispTune - Where melodies drift like the wind

WhispTune is a modern, offline-first desktop music player built with Rust (Tauri) and Vanilla JavaScript.
It offers a clean, responsive interface with advanced playback features for both local and online songs.




## ✨Features

- 📂 **Local Music Import**  
  Easily select folders and load supported audio files (`.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`).

- 🖼️ **Auto Metadata & Album Art Extraction**  
  Parses embedded metadata (title, artist, cover art) automatically.

- 🔁 **Playback Controls**  
  Includes shuffle, loop-all, loop-once, and media key support.

- ❤️ **Favorites & Playlists**  
  Organize songs into favorites or custom playlists.

- 🔎 **Live Search**  
  Quickly filter songs with instant search.

- 🔄 **Miniplayer & Full Player Sync**  
  Switch seamlessly between compact and full views.


## 🌐 Optional: Online Mode (YouTube)

WhispTune supports streaming audio from YouTube videos or playlists using `yt-dlp`.

> ⚠️ **Note**:  
> Due to YouTube's policies, **WhispTune does NOT include `yt-dlp`**.  
> To enable online search/streaming, you must manually download [yt-dlp](https://github.com/yt-dlp/yt-dlp) and place it in a `bin/` folder:
mkdir bin
cd bin
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o yt-dlp
## Developer Setup
Prerequisites
- Node.js
- Rust
- Tauri CLI
## Steps
 `git clone https://github.com/yourusername/WhispTune.git` \
  `cd WhispTune` \
  `npm install` \
   `npm run tauri dev`
## 📦Building the App

`npm run tauri build`
---
This creates a standalone desktop application in the src-tauri/target/release/ directory.
## 📁 Tech Stack
  🦀 Rust — Native backend

⚙️ Tauri — Lightweight desktop runtime

🎧 Howler.js — Audio engine

🏷️ jsmediatags & lofty-rs — Metadata extraction

✨ Vanilla JS, HTML, CSS — UI logic and layout

💡 Anime.js — Animation

## AI Assistance
Qwen,
ChatGPT,
 Deepseek,
 Github's Copilot,
 Google Gemini 

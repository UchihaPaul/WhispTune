# 🎵 WhispTune: Your Personal Audio Sanctuary

> *Where melodies drift like the wind...*

WhispTune is a **modern, offline-first desktop music player** crafted for music lovers who crave performance, beauty, and simplicity. Built with the **power of Rust** and a **sleek Vanilla JavaScript** interface, WhispTune transforms your music experience whether it’s offline bliss or online discovery.

---

## ✨ Features That Sing

### 🎼 Effortless Local Music Import
Just point WhispTune to your music folders and it’ll gracefully collect and organize audio files like:
- `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`

### 🖼️ Smart Metadata & Album Art
No more mystery tracks! WhispTune extracts:
- Song titles
- Artists
- Album art  

### 🎚️ Intuitive Playback Controls
Control your vibes with:
- Shuffle, Loop All, Loop Once
- Media key support – manage playback *without switching windows*

---

## 🌐 Dive Deeper with Online Mode

**Stream YouTube audio** (videos & playlists) directly in WhispTune using the awesome `yt-dlp`.

> ⚠️ **Heads Up:** yt-dlp is not bundled due to YouTube's policies. Set it up manually to enable streaming:

### 🛠️ Setup Instructions:
```bash
# Create a directory to store yt-dlp
mkdir bin
cd bin

# Download yt-dlp (For Windows)
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o yt-dlp
```

---

## 🧑‍💻 Developer's Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/)
- [Tauri CLI](https://tauri.app/)

### 🚀 Get Started
```bash
git clone https://github.com/UchihaPaul/WhispTune.git
cd WhispTune
npm install
npm run tauri dev
```

### 📦 Build for Production
```bash
npm run tauri build
```
> Final app found in: `src-tauri/target/release/`

---

## 🧠 Under the Hood

| Layer        | Tech Stack                                     |
|--------------|------------------------------------------------|
| **Backend**  | Rust                                            |
| **Frontend** | Vanilla JS, HTML, CSS                          |
| **Framework**| Tauri                                           |
| **Audio Engine** | Howler.js                                 |
| **Metadata Parsing** | jsmediatags (JS) & lofty-rs (Rust)     |
| **Animations** | Anime.js                                    |

---

## 💡 Acknowledgements

Huge shoutout to the AI copilots who helped bring WhispTune to life:
**Qwen, ChatGPT, DeepSeek, GitHub Copilot, Google Gemini**

---

> 🎶 WhispTune isn't just a player - it's your **safe space for sound**.

> 🥚 *Psst... WhispTune carry secrets. Try a few key combos and clicks - you might unlock a little magic inside WhispTune.*

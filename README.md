<div align="center">

<img src="src-tauri/icons/128x128@2x.png" alt="WhispTune Logo" width="150" />

# WhispTune

**Your Personal Audio Sanctuary**

*Where melodies drift like the wind*

[![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri-blue?style=flat-square)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Backend-Rust-orange?style=flat-square)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE.txt)

</div>

---

An offline-first music player crafted for quiet focus and effortless listening

---

## Table of Contents

- [Features](#features)
- [Online Streaming](#online-streaming)
- [Getting Started](#getting-started)
- [Building for Production](#building-for-production)
- [Tech Stack](#tech-stack)
- [Acknowledgements](#acknowledgements)

---

## Features

### Local Music Import
Point WhispTune to your music folders and it will gracefully collect and organize your audio files:
- `.mp3` `.wav` `.ogg` `.flac` `.m4a`

### Smart Metadata Extraction
No more mystery tracks. WhispTune automatically extracts:
- Song titles
- Artist information
- Album artwork

### Intuitive Playback Controls
Take full control of your listening experience:
- Shuffle, Loop All, Loop Once modes
- Media key support—manage playback without switching windows

---

## Online Streaming

Stream YouTube audio directly in WhispTune using `yt-dlp`.

> **Note:** yt-dlp is not bundled due to YouTube's policies. Manual setup is required to enable streaming.

### Setup

```bash
# Create directory for yt-dlp
mkdir bin
cd bin

# Download yt-dlp (Windows)
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o yt-dlp
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/)
- [Tauri CLI](https://tauri.app/)

### Installation

```bash
git clone https://github.com/UchihaPaul/WhispTune.git
cd WhispTune
npm install
npm run tauri dev
```

---

## Building for Production

```bash
npm run tauri build
```

The compiled application will be available in `src-tauri/target/release/`

---

## Tech Stack

| Component          | Technology                        |
|--------------------|-----------------------------------|
| Backend            | Rust                              |
| Frontend           | Vanilla JS, HTML, CSS             |
| Framework          | Tauri                             |
| Audio Engine       | Howler.js                         |
| Metadata Parsing   | jsmediatags (JS), lofty-rs (Rust) |
| Animations         | Anime.js                          |

---

## Acknowledgements

Special thanks to the AI assistants that contributed to WhispTune's development:

**Qwen** · **ChatGPT** · **DeepSeek** · **GitHub Copilot** · **Google Gemini**

---

<div align="center">

*WhispTune is more than a player—it's your safe space for sound.*

<sub>Hidden features await the curious. Explore key combinations and discover the magic within.</sub>

</div>

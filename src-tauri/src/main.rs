#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use lofty::{file::TaggedFileExt, prelude::Accessor, probe::Probe, tag::{Tag, TagType}};
use serde::{Deserialize, Serialize};
use std::{
    path::{Path, PathBuf},
    process::Command,
};
use tauri::{AppHandle, Manager, Result};
use tauri_plugin_dialog::{DialogExt, FilePath};
use tokio::{fs, task};
use walkdir::WalkDir;

const SUPPORTED_AUDIO_EXTENSIONS: [&str; 5] = ["mp3", "wav", "ogg", "flac", "m4a"];
const YTDLP_AUDIO_FORMAT: &str = "bestaudio[ext=m4a]/bestaudio/best";
const SETTINGS_FILE: &str = "settings.json";
const DEFAULT_VOLUME: f64 = 0.5;

// ─────────────────────────────────────────────────────────────────────────────
// Error Types
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, thiserror::Error, Serialize, Clone)]
#[serde(untagged)]
pub enum CommandError {
    #[error("IO Error: {0}")]
    Io(String),
    #[error("Lofty Metadata Error: {0}")]
    Lofty(String),
    #[error("Dialog Error: {0}")]
    Dialog(String),
    #[error("Not Found: {0}")]
    NotFound(String),
    #[error("Process Failed: {0}")]
    ProcessFailed(String),
    #[error("Unknown Error: {0}")]
    Unknown(String),
}

impl From<std::io::Error> for CommandError {
    fn from(err: std::io::Error) -> Self {
        Self::Io(err.to_string())
    }
}

impl From<lofty::error::LoftyError> for CommandError {
    fn from(err: lofty::error::LoftyError) -> Self {
        Self::Lofty(err.to_string())
    }
}

impl From<CommandError> for tauri::Error {
    fn from(error: CommandError) -> Self {
        Self::Anyhow(anyhow::anyhow!(error.to_string()))
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Structures
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Clone)]
pub struct AudioFile {
    pub path: String,
    pub file_name: String,
    pub display_name: String,
    pub artist: String,
    pub extension: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct OnlineSong {
    pub title: String,
    pub artist: String,
    pub stream_url: String,
    pub thumbnail: String,
    pub duration: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserSettings {
    pub volume: f64,
    pub global_shortcuts_enabled: bool,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            volume: DEFAULT_VOLUME,
            global_shortcuts_enabled: true,
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

fn get_ytdlp_path() -> &'static str {
    #[cfg(target_os = "windows")]
    {
        if Path::new("bin/yt-dlp.exe").exists() {
            "bin/yt-dlp.exe"
        } else {
            "yt-dlp.exe"
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        if Path::new("bin/yt-dlp").exists() {
            "bin/yt-dlp"
        } else {
            "yt-dlp"
        }
    }
}

fn extract_audio_metadata(path: &Path) -> (String, String) {
    let file_name = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown_file")
        .to_string();
    
    let mut display_name = file_name.clone();
    let mut artist = "Unknown Artist".to_string();
    
    if let Ok(parsed_file) = Probe::open(path).and_then(|probe| probe.read()) {
        let tag = parsed_file
            .primary_tag()
            .cloned()
            .or_else(|| parsed_file.first_tag().cloned())
            .unwrap_or_else(|| Tag::new(TagType::Id3v2));
        
        if let Some(title) = tag.title() {
            display_name = title.to_string();
        }
        if let Some(art) = tag.artist() {
            artist = art.to_string();
        }
    }
    
    (display_name, artist)
}

async fn get_settings_path(app_handle: &AppHandle) -> std::result::Result<PathBuf, CommandError> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| CommandError::Io(format!("Failed to get app data dir: {e}")))?;
    
    Ok(app_data_dir.join(SETTINGS_FILE))
}

// ─────────────────────────────────────────────────────────────────────────────
// Tauri Commands
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
async fn select_and_list_audio_files(app_handle: AppHandle) -> Result<Vec<AudioFile>> {
    let folder_path = pick_folder(&app_handle)?;

    // Stream processing - don't collect all entries first
    let audio_files = task::spawn_blocking(move || {
        WalkDir::new(&folder_path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|entry| entry.path().is_file())
            .filter_map(|entry| process_audio_entry(entry.path()))
            .collect::<Vec<_>>()
    })
    .await
    .map_err(|e| CommandError::Unknown(format!("Blocking task panicked: {e}")))?;

    Ok(audio_files)
}

fn pick_folder(app_handle: &AppHandle) -> Result<PathBuf> {
    let (tx, rx) = std::sync::mpsc::channel();

    app_handle.dialog().file().pick_folder(move |folder_path_option: Option<FilePath>| {
        let result: Result<PathBuf> = match folder_path_option {
            Some(file_path) => file_path
                .into_path()
                .map_err(|e| CommandError::Dialog(format!("Failed: {e}")).into()),
            None => Err(CommandError::Dialog("Folder selection cancelled".into()).into()),
        };
        let _ = tx.send(result);
    });

    match rx.recv() {
        Ok(result) => result,
        Err(e) => Err(CommandError::Dialog(format!("Channel error: {e}")).into()),
    }
}

fn process_audio_entry(path: &Path) -> Option<AudioFile> {
    let extension = path.extension()?;
    let ext_str = extension.to_string_lossy().to_lowercase();
    
    if !SUPPORTED_AUDIO_EXTENSIONS.contains(&ext_str.as_str()) {
        return None;
    }
    
    let file_name = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown_file")
        .to_string();
    
    let (display_name, artist) = extract_audio_metadata(path);
    
    Some(AudioFile {
        path: path.to_string_lossy().into_owned(),
        file_name,
        display_name,
        artist,
        extension: ext_str,
    })
}

#[tauri::command]
async fn read_file_content(path: String) -> Result<Vec<u8>> {
    fs::read(&path)
        .await
        .map_err(|e| CommandError::Io(format!("Failed to read file: {e}")).into())
}

#[tauri::command]
async fn save_user_settings(app_handle: AppHandle, settings: UserSettings) -> Result<()> {
    let settings_path = get_settings_path(&app_handle).await?;

    if let Some(parent) = settings_path.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|e| CommandError::Io(format!("Failed to create app data dir: {e}")))?;
    }
    
    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| CommandError::Io(format!("Failed to serialize settings: {e}")))?;
    
    fs::write(&settings_path, json)
        .await
        .map_err(|e| CommandError::Io(format!("Failed to write settings: {e}")))?;
    
    Ok(())
}

#[tauri::command]
async fn load_user_settings(app_handle: AppHandle) -> Result<UserSettings> {
    let settings_path = get_settings_path(&app_handle).await?;

    if !settings_path.exists() {
        return Ok(UserSettings::default());
    }

    let json = fs::read_to_string(&settings_path)
        .await
        .map_err(|e| CommandError::Io(format!("Failed to read settings: {e}")))?;

    Ok(serde_json::from_str(&json).unwrap_or_default())
}

#[tauri::command]
async fn search_playlist_and_stream(song_name: String) -> Result<Vec<OnlineSong>> {
    let ytdlp = get_ytdlp_path();
    let args = build_ytdlp_args(&song_name);

    let output = task::spawn_blocking(move || execute_ytdlp(ytdlp, &args))
        .await
        .map_err(|e| CommandError::Unknown(format!("Blocking task panicked: {e}")))?
        ?;

    let songs = parse_ytdlp_output(&output);
    Ok(songs)
}

fn build_ytdlp_args(input: &str) -> Vec<String> {
    let is_playlist = input.contains("youtube.com/playlist?list=") 
        || input.contains("music.youtube.com/playlist?list=")
        || (input.contains("music.youtube.com/watch") && input.contains("&list="));

    let is_video = input.contains("youtube.com/watch?v=") 
        || input.contains("music.youtube.com/watch?v=")
        || input.contains("youtu.be/");

    let common_args = vec![
        "--dump-json".into(),
        "--ignore-errors".into(),
        "--extractor-args".into(),
        "youtube:player_client=default".into(),
        "-f".into(),
        YTDLP_AUDIO_FORMAT.into(),
    ];

    if is_playlist {
        let mut args = common_args;
        args.insert(1, "--yes-playlist".into());
        args.push(input.to_string());
        args
    } else if is_video {
        let mut args = common_args;
        args.insert(1, "--no-playlist".into());
        args.push(input.to_string());
        args
    } else {
        let mut args = vec![format!("ytsearch1:{input}")];
        args.extend(common_args);
        args
    }
}

fn execute_ytdlp(ytdlp: &str, args: &[String]) -> std::result::Result<String, CommandError> {
    let mut cmd = Command::new(ytdlp);
    cmd.args(args);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let output = cmd.output().map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            CommandError::NotFound(
                "yt-dlp not found. Please install yt-dlp and ensure it's in bin/ or system PATH".into()
            )
        } else {
            CommandError::Io(format!("Failed to spawn yt-dlp: {e}"))
        }
    })?;

    let stdout = String::from_utf8_lossy(&output.stdout).into_owned();

    if !output.status.success() && stdout.trim().is_empty() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let exit_code = output.status.code()
            .map(|c| format!(" (exit code {c})"))
            .unwrap_or_default();
        return Err(CommandError::ProcessFailed(format!("yt-dlp failed{exit_code}: {stderr}")));
    }

    Ok(stdout)
}

fn parse_ytdlp_output(raw: &str) -> Vec<OnlineSong> {
    raw.lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                return None;
            }
            
            let json: serde_json::Value = serde_json::from_str(trimmed).ok()?;
            
            let artist = json["artist"]
                .as_str()
                .or_else(|| json["uploader"].as_str())
                .unwrap_or("Unknown")
                .to_string();

            Some(OnlineSong {
                title: json["title"].as_str().unwrap_or("Unknown").to_string(),
                artist,
                stream_url: json["url"].as_str().unwrap_or("").to_string(),
                thumbnail: json["thumbnail"].as_str().unwrap_or("").to_string(),
                duration: json["duration"].as_f64().unwrap_or(0.0),
            })
        })
        .collect()
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry Point
// ─────────────────────────────────────────────────────────────────────────────

pub fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            select_and_list_audio_files,
            read_file_content,
            search_playlist_and_stream,
            save_user_settings,
            load_user_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
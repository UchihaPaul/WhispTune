#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager, Result};
use tauri_plugin_dialog::{DialogExt, FilePath};
use walkdir::WalkDir;
use tokio::{fs, task};
use std::path::{Path, PathBuf};
use lofty::{probe::Probe, prelude::Accessor, file::TaggedFileExt, tag::{Tag, TagType}};
use std::process::Command;
use serde::Serialize;
use rayon::prelude::*;

#[derive(Debug, thiserror::Error, serde::Serialize, Clone)]
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
    fn from(err: std::io::Error) -> Self { CommandError::Io(err.to_string()) }
}
impl From<lofty::error::LoftyError> for CommandError {
    fn from(err: lofty::error::LoftyError) -> Self { CommandError::Lofty(err.to_string()) }
}
impl From<CommandError> for tauri::Error {
    fn from(error: CommandError) -> Self { Self::Anyhow(anyhow::anyhow!(error.to_string())) }
}

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

#[derive(Debug, Serialize, serde::Deserialize, Clone)]
pub struct UserSettings {
    pub volume: f64,
    pub global_shortcuts_enabled: bool,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            volume: 0.5,
            global_shortcuts_enabled: true,
        }
    }
}

#[tauri::command]
async fn select_and_list_audio_files(app_handle: AppHandle) -> Result<Vec<AudioFile>> {
    let (tx, rx) = std::sync::mpsc::channel();

    app_handle.dialog().file().pick_folder(move |folder_path_option: Option<FilePath>| {
        let path_buf_intermediate_result: std::result::Result<PathBuf, CommandError> = match folder_path_option {
            Some(file_path) => file_path.into_path().map_err(|e| CommandError::Dialog(format!("Failed: {}", e))),
            _ => Err(CommandError::Dialog("Folder selection cancelled".into())),
        };
        let final_result: Result<PathBuf> = path_buf_intermediate_result.map_err(|e| e.into());
        if let Err(e) = tx.send(final_result) {
            eprintln!("Failed to send folder path over channel: {e}");
        }
    });

    let folder_path: PathBuf = match rx.recv() {
        Ok(Ok(path_buf)) => path_buf,
        Ok(Err(tauri_err)) => return Err(tauri_err),
        Err(e) => return Err(CommandError::Dialog(format!("Channel error: {}", e)).into()),
    };
    let supported_extensions = ["mp3", "wav", "ogg", "flac", "m4a"];
    let entries: Vec<_> = WalkDir::new(&folder_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|entry| entry.path().is_file())
        .collect();
    let audio_files = task::spawn_blocking(move || {
        entries.par_iter().filter_map(|entry| {
            let path = entry.path();
            if let Some(extension) = path.extension() {
                let ext_str = extension.to_string_lossy().to_lowercase();
                if supported_extensions.contains(&ext_str.as_str()) {
                    let file_name = path.file_name().and_then(|s| s.to_str()).unwrap_or("unknown_file").to_string();
                    let mut display_name = file_name.clone();
                    let mut artist = "Unknown Artist".to_string();
                    if let Ok(parsed_file) = Probe::open(&path).and_then(|probe| probe.read()) {
                        let tag = parsed_file.primary_tag().cloned()
                            .or_else(|| parsed_file.first_tag().cloned())
                            .unwrap_or_else(|| Tag::new(TagType::Id3v2));
                        if let Some(title) = tag.title() { display_name = title.to_string(); }
                        if let Some(art) = tag.artist() { artist = art.to_string(); }
                    }
                    return Some(AudioFile {
                        path: path.to_string_lossy().into_owned(),
                        file_name,
                        display_name,
                        artist,
                        extension: ext_str,
                    });
                }
            }
            None
        }).collect::<Vec<_>>()
    }).await.map_err(|e| CommandError::Unknown(format!("Blocking task panicked: {e}")))?;

    Ok(audio_files)
}

#[tauri::command]
async fn read_file_content(path: String) -> Result<Vec<u8>> {
    fs::read(&path).await.map_err(|e| CommandError::Io(format!("Failed to read file: {}", e)).into())
}

#[tauri::command]
async fn save_user_settings(app_handle: AppHandle, settings: UserSettings) -> Result<()> {
    let app_data_dir = app_handle.path().app_data_dir()
        .map_err(|e| CommandError::Io(format!("Failed to get app data dir: {}", e)))?;
        fs::create_dir_all(&app_data_dir).await
        .map_err(|e| CommandError::Io(format!("Failed to create app data dir: {}", e)))?;
    
    let settings_path = app_data_dir.join("settings.json");
    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| CommandError::Io(format!("Failed to serialize settings: {}", e)))?;
    
    fs::write(&settings_path, json).await
        .map_err(|e| CommandError::Io(format!("Failed to write settings: {}", e)))?;
    
    Ok(())
}

#[tauri::command]
async fn load_user_settings(app_handle: AppHandle) -> Result<UserSettings> {
    let app_data_dir = app_handle.path().app_data_dir()
        .map_err(|e| CommandError::Io(format!("Failed to get app data dir: {}", e)))?;
    
    let settings_path = app_data_dir.join("settings.json");
        if !settings_path.exists() {
        return Ok(UserSettings::default());
    }
    
    let json = fs::read_to_string(&settings_path).await
        .map_err(|e| CommandError::Io(format!("Failed to read settings: {}", e)))?;
    
    let settings: UserSettings = serde_json::from_str(&json)
        .unwrap_or_else(|_| UserSettings::default());
    
    Ok(settings)
}
#[tauri::command]
async fn search_playlist_and_stream(song_name: String) -> Result<Vec<OnlineSong>> {
    #[cfg(target_os = "windows")]
    let ytdlp = if Path::new("bin/yt-dlp.exe").exists() {
        "bin/yt-dlp.exe"
    } else {
        "yt-dlp.exe" 
    };
    #[cfg(not(target_os = "windows"))]
    let ytdlp = if Path::new("bin/yt-dlp").exists() {
        "bin/yt-dlp"
    } else {
        "yt-dlp" 
    };

    let is_playlist = song_name.contains("youtube.com/playlist?list=") || song_name.contains("music.youtube.com/playlist?list=");
    let is_video = song_name.contains("youtube.com/watch?v=") || song_name.contains("youtu.be/");

    let args = if is_playlist {
        vec![
            "--dump-json".to_string(),
            "--yes-playlist".to_string(),
            "-f".to_string(),
            "bestaudio[ext=m4a]/bestaudio/best".to_string(),
            song_name.clone(),
        ]
    } else if is_video {
        vec![
            "--dump-json".to_string(),
            "-f".to_string(),
            "bestaudio[ext=m4a]/bestaudio/best".to_string(),
            song_name.clone(),
        ]
    } else {
        vec![
            format!("ytsearch1:{}", song_name),
            "--dump-json".to_string(),
            "-f".to_string(),
            "bestaudio[ext=m4a]/bestaudio/best".to_string(),
        ]
    };

    let output = task::spawn_blocking(move || {
        let mut cmd = Command::new(ytdlp);
        cmd.args(&args);        
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }
        
        cmd.output()
    }).await.map_err(|e| CommandError::Unknown(format!("Blocking task panicked: {e}")))?
      .map_err(|e| {
          if e.kind() == std::io::ErrorKind::NotFound {
              CommandError::NotFound(format!("yt-dlp not found. Please install yt-dlp and ensure it's in bin/ or system PATH"))
          } else {
              CommandError::Io(format!("Failed to spawn yt-dlp: {e}"))
          }
      })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let exit_code = output.status.code().map(|c| format!(" (exit code {})", c)).unwrap_or_default();
        return Err(CommandError::ProcessFailed(format!("yt-dlp failed{exit_code}: {stderr}")).into());
    }

    let raw = String::from_utf8_lossy(&output.stdout);

    let songs: Vec<OnlineSong> = raw
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            if trimmed.is_empty() { return None; }
            let json: serde_json::Value = serde_json::from_str(trimmed).ok()?;
            let artist = json["artist"].as_str()
                .or_else(|| json["uploader"].as_str())
                .unwrap_or("Unknown").to_string();
            Some(OnlineSong {
                title: json["title"].as_str().unwrap_or("Unknown").to_string(),
                artist,
                stream_url: json["url"].as_str().unwrap_or("").to_string(),
                thumbnail: json["thumbnail"].as_str().unwrap_or("").to_string(),
                duration: json["duration"].as_f64().unwrap_or(0.0),
            })
        })
        .collect();

    Ok(songs)
}

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
            load_user_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

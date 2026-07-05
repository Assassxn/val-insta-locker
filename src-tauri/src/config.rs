use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MapMacro {
    pub agent_id: String,
    pub agent_name: String,
    pub lock_mode: String, // "lock" | "select"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub selected_agent_id: String,
    pub selected_agent_name: String,
    pub lock_mode: String, // "lock" | "select"
    pub delay_ms: u64,
    pub theme: String,       // "dark" | "light"
    pub macro_enabled: bool,
    pub map_macros: HashMap<String, MapMacro>,
    #[serde(default)]
    pub favorite_agent_ids: Vec<String>,
    #[serde(default)]
    pub low_animations: bool,
    #[serde(default)]
    pub has_seen_welcome: bool,
    #[serde(default = "default_true")]
    pub hide_to_tray_on_close: bool,
}

fn default_true() -> bool { true }

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            selected_agent_id: String::new(),
            selected_agent_name: String::new(),
            lock_mode: "lock".to_string(),
            delay_ms: 100,
            theme: "dark".to_string(),
            macro_enabled: false,
            map_macros: HashMap::new(),
            favorite_agent_ids: Vec::new(),
            low_animations: false,
            has_seen_welcome: false,
            hide_to_tray_on_close: true,
        }
    }
}

fn config_path() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("val-insta-locker")
        .join("config.json")
}

pub fn load_config() -> AppConfig {
    let path = config_path();
    if !path.exists() {
        return AppConfig::default();
    }
    std::fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn save_config(config: &AppConfig) -> Result<()> {
    let path = config_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(&path, serde_json::to_string_pretty(config)?)?;
    Ok(())
}

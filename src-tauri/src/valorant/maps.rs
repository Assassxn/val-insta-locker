use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Map {
    pub display_name: String,
    pub map_url: String,
    pub list_view_icon: String,
    pub splash: String,
}

#[derive(Deserialize)]
struct ApiMap {
    #[serde(rename = "displayName")]
    display_name: String,
    #[serde(rename = "mapUrl")]
    map_url: Option<String>,
    #[serde(rename = "listViewIcon")]
    list_view_icon: Option<String>,
    splash: Option<String>,
    #[serde(rename = "tacticalDescription")]
    tactical_description: Option<String>,
}

#[derive(Deserialize)]
struct ApiResponse {
    data: Vec<ApiMap>,
}

pub async fn fetch_maps() -> Result<Vec<Map>> {
    let client = reqwest::Client::new();
    let resp = client
        .get("https://valorant-api.com/v1/maps")
        .send()
        .await?;

    let api: ApiResponse = resp.json().await?;

    let mut maps: Vec<Map> = api
        .data
        .into_iter()
        .filter(|m| m.tactical_description.as_deref().map(|s| !s.is_empty()).unwrap_or(false))
        .map(|m| Map {
            display_name: m.display_name,
            map_url: m.map_url.unwrap_or_default(),
            list_view_icon: m.list_view_icon.unwrap_or_default(),
            splash: m.splash.unwrap_or_default(),
        })
        .collect();

    maps.sort_by(|a, b| a.display_name.cmp(&b.display_name));
    Ok(maps)
}

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GenerateApiRequest {
    prompt: String,
    make_instrumental: Option<bool>,
    model: Option<String>,
    provider: Option<String>,
    lyrics: Option<String>,
    is_instrumental: Option<bool>,
    lyrics_optimizer: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GenerateApiResponse {
    id: String,
    status: String,
    audio_url: Option<String>,
    duration: Option<f64>,
    title: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StatusApiResponse {
    id: String,
    status: String,
    title: Option<String>,
    image_url: Option<String>,
    audio_url: Option<String>,
    video_url: Option<String>,
    duration: Option<f64>,
    error: Option<String>,
    tags: Option<String>,
    model: Option<String>,
}

fn get_suno_api_base() -> String {
    std::env::var("SUNO_API_BASE").unwrap_or_else(|_| "https://api.suno.ai".to_string())
}

fn get_suno_api_key() -> String {
    std::env::var("SUNO_API_KEY").unwrap_or_default()
}

fn get_suno_cookie() -> String {
    std::env::var("SUNO_COOKIE").unwrap_or_default()
}

fn get_minimax_api_base() -> String {
    std::env::var("MINIMAX_API_BASE").unwrap_or_else(|_| "https://api.minimaxi.com".to_string())
}

fn get_minimax_api_key() -> String {
    std::env::var("MINIMAX_API_KEY").unwrap_or_default()
}

fn build_suno_headers() -> Vec<(&'static str, String)> {
    let mut headers = vec![("Content-Type", "application/json".to_string())];
    let api_key = get_suno_api_key();
    if !api_key.is_empty() {
        headers.push(("Authorization", format!("Bearer {}", api_key)));
    }
    let cookie = get_suno_cookie();
    if !cookie.is_empty() {
        headers.push(("Cookie", cookie));
    }
    headers
}

fn build_minimax_headers() -> Vec<(&'static str, String)> {
    vec![
        ("Content-Type", "application/json".to_string()),
        ("Authorization", format!("Bearer {}", get_minimax_api_key())),
    ]
}

fn map_clip_status(status: &str) -> String {
    let s = status.to_lowercase();
    if s == "complete" || s == "completed" {
        "complete".to_string()
    } else if s == "error" || s == "failed" {
        "error".to_string()
    } else if s == "streaming" {
        "streaming".to_string()
    } else if s == "generating" || s == "processing" {
        "generating".to_string()
    } else {
        "pending".to_string()
    }
}

#[tauri::command]
async fn generate_music(request: GenerateApiRequest) -> Result<GenerateApiResponse, String> {
    let client = reqwest::Client::new();

    if request.provider.as_deref() == Some("minimax") {
        handle_minimax_generate(&client, &request).await
    } else {
        handle_suno_generate(&client, &request).await
    }
}

async fn handle_suno_generate(
    client: &reqwest::Client,
    request: &GenerateApiRequest,
) -> Result<GenerateApiResponse, String> {
    if request.prompt.trim().is_empty() {
        return Err("请输入有效的提示词".to_string());
    }

    let payload = serde_json::json!({
        "gpt_description_prompt": request.prompt.trim(),
        "make_instrumental": request.make_instrumental.unwrap_or(false),
        "model": request.model.as_deref().unwrap_or("chirp-v4"),
    });

    let headers = build_suno_headers();
    let mut req_builder = client
        .post(format!("{}/api/generate", get_suno_api_base()))
        .json(&payload);

    for (key, value) in headers {
        req_builder = req_builder.header(key, value);
    }

    let response = req_builder
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status().as_u16();
        let error_text = response.text().await.unwrap_or_default();
        log::error!("Suno API error: {} {}", status, error_text);
        return Err(format!("Suno API 错误: {}", status));
    }

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    if let Some(clips) = data.get("clips").and_then(|c| c.as_array()) {
        if let Some(clip) = clips.first() {
            let id = clip
                .get("id")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_string();
            return Ok(GenerateApiResponse {
                id,
                status: "generating".to_string(),
                audio_url: None,
                duration: None,
                title: None,
            });
        }
    }

    Err("Suno API 返回了意外的响应格式".to_string())
}

async fn handle_minimax_generate(
    client: &reqwest::Client,
    request: &GenerateApiRequest,
) -> Result<GenerateApiResponse, String> {
    if request.prompt.trim().is_empty() {
        return Err("请输入有效的音乐描述".to_string());
    }

    let api_key = get_minimax_api_key();
    if api_key.is_empty() {
        return Err("未配置 MINIMAX_API_KEY".to_string());
    }

    let mut payload = serde_json::json!({
        "model": request.model.as_deref().unwrap_or("music-2.6"),
        "prompt": request.prompt.trim(),
        "output_format": "url",
        "audio_setting": {
            "sample_rate": 44100,
            "bitrate": 256000,
            "format": "mp3",
        },
    });

    if request.is_instrumental.unwrap_or(false) {
        payload["is_instrumental"] = serde_json::json!(true);
        payload["lyrics"] = serde_json::json!("");
    } else if request.lyrics_optimizer.unwrap_or(false)
        && request.lyrics.as_deref().unwrap_or("").trim().is_empty()
    {
        payload["lyrics_optimizer"] = serde_json::json!(true);
        payload["lyrics"] = serde_json::json!("");
    } else if let Some(lyrics) = &request.lyrics {
        if !lyrics.trim().is_empty() {
            payload["lyrics"] = serde_json::json!(lyrics.trim());
        } else {
            return Err("请输入歌词或开启AI自动写歌词".to_string());
        }
    } else {
        return Err("请输入歌词或开启AI自动写歌词".to_string());
    }

    let headers = build_minimax_headers();
    let mut req_builder = client
        .post(format!("{}/v1/music_generation", get_minimax_api_base()))
        .json(&payload);

    for (key, value) in headers {
        req_builder = req_builder.header(key, value);
    }

    let response = req_builder
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status().as_u16();
        let error_text = response.text().await.unwrap_or_default();
        log::error!("Minimax API error: {} {}", status, error_text);
        return Err(format!("Minimax API 错误: {}", status));
    }

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let base_resp = data.get("base_resp");
    if let Some(br) = base_resp {
        let status_code = br.get("status_code").and_then(|v| v.as_i64()).unwrap_or(0);
        if status_code != 0 {
            let msg = br
                .get("status_msg")
                .and_then(|v| v.as_str())
                .unwrap_or("Minimax API 返回错误");
            return Err(msg.to_string());
        }
    }

    let audio_url = data
        .pointer("/data/audio")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let duration = data
        .pointer("/extra_info/music_duration")
        .and_then(|v| v.as_f64())
        .map(|d| (d / 1000.0).round());

    let trace_id = data
        .get("trace_id")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("minimax-{}", chrono::Utc::now().timestamp_millis()));

    let title_chars: Vec<char> = request.prompt.trim().chars().collect();
    let title: String = title_chars.into_iter().take(30).collect();

    Ok(GenerateApiResponse {
        id: trace_id,
        status: "complete".to_string(),
        audio_url: if audio_url.is_empty() {
            None
        } else {
            Some(audio_url)
        },
        duration,
        title: Some(title),
    })
}

#[tauri::command]
async fn get_generation_status(id: String) -> Result<StatusApiResponse, String> {
    if id.is_empty() {
        return Err("缺少生成任务ID".to_string());
    }

    let client = reqwest::Client::new();
    let headers = build_suno_headers();
    let mut req_builder = client.get(format!(
        "{}/api/get?ids={}",
        get_suno_api_base(),
        id
    ));

    for (key, value) in headers {
        req_builder = req_builder.header(key, value);
    }

    let response = req_builder
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status().as_u16();
        return Err(format!("获取状态失败: {}", status));
    }

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let clip = if data.is_array() {
        data.as_array().and_then(|a| a.first()).cloned()
    } else {
        Some(data)
    };

    let clip = match clip {
        Some(c) => c,
        None => return Err("未找到对应的生成任务".to_string()),
    };

    let status = clip
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let mapped_status = map_clip_status(status);

    Ok(StatusApiResponse {
        id: clip
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        status: mapped_status,
        title: clip
            .get("title")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        image_url: clip
            .get("image_url")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        audio_url: clip
            .get("audio_url")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        video_url: clip
            .get("video_url")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        duration: clip.get("duration").and_then(|v| v.as_f64()),
        error: clip
            .get("error")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        tags: clip
            .pointer("/metadata/tags")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        model: clip
            .get("model_name")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
    })
}

#[tauri::command]
async fn open_external_url(url: String, app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_shell::ShellExt;
    app.shell()
        .open(url, None)
        .map_err(|e| format!("打开链接失败: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            generate_music,
            get_generation_status,
            open_external_url,
        ])
        .setup(|app| {
            log::info!("AI Music Generator starting...");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

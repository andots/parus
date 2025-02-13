use std::sync::Mutex;

use mejiro_core::tree::BookmarkArena;
use tauri::{Emitter, EventTarget};

use crate::{constants::APP_WEBVIEW_LABEL, error::AppError, events::AppEvent};

#[tauri::command]
pub async fn get_nested_json(
    state: tauri::State<'_, Mutex<BookmarkArena>>,
) -> Result<String, AppError> {
    let arena = state
        .lock()
        .map_err(|_| AppError::Mutex("can't get bookmarks".to_string()))?;
    Ok(arena.to_nested_json(1)?)
}

#[tauri::command]
pub async fn add_bookmark(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, Mutex<BookmarkArena>>,
    url: String,
    title: Option<String>,
) -> Result<(), AppError> {
    let mut arena = state
        .lock()
        .map_err(|_| AppError::Mutex("can't get bookmarks".to_string()))?;
    arena.add_bookmark(url, title)?;

    app_handle.emit_to(
        EventTarget::webview(APP_WEBVIEW_LABEL),
        AppEvent::BookmarkUpdated.as_ref(),
        arena.to_nested_json(1)?,
    )?;

    Ok(())
}

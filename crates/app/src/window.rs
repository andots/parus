use std::sync::Mutex;

use tauri::{
    Emitter, LogicalPosition, LogicalSize, Url, WebviewBuilder, WebviewUrl, WindowBuilder,
};
use tauri::{EventTarget, Manager};

use parus_common::{
    constants::{
        APP_WEBVIEW_LABEL, APP_WEBVIEW_URL, EXTERNAL_WEBVIEW_LABEL, MAINWINDOW_LABEL,
        MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH,
    },
    AppEvent, AppHandleAppExt, AppHandlePathExt, Error,
};

use tauri_plugin_app_settings::{default_start_page_url, AppSettings};
use tauri_plugin_window_geometry::WindowGeometry;

/// Get the app webview
pub fn get_app_webview(app_handle: &tauri::AppHandle) -> Result<tauri::Webview, Error> {
    app_handle
        .get_webview(APP_WEBVIEW_LABEL)
        .ok_or(Error::WebviewNotFound)
}

/// Get the external webview
pub fn get_external_webview(app_handle: &tauri::AppHandle) -> Result<tauri::Webview, Error> {
    app_handle
        .get_webview(EXTERNAL_WEBVIEW_LABEL)
        .ok_or(Error::WebviewNotFound)
}

/// Create the main window with the app and external webviews.
/// The app webview is the main webview that loads the app.
/// The external webview is a webview that loads external URLs and placed on the right side of the app webview (overlayed).
pub fn create_window(app_handle: &tauri::AppHandle) -> tauri::Result<()> {
    let settings_state = app_handle.state::<Mutex<AppSettings>>();
    let settings = settings_state
        .lock()
        .map_err(|e| anyhow::anyhow!("{:?}", e))?;

    let geometry_state = app_handle.state::<Mutex<WindowGeometry>>();
    let geometry = geometry_state
        .lock()
        .map_err(|e| anyhow::anyhow!("{:?}", e))?;

    let window = create_main_window(app_handle, &geometry)?;

    let app_webview = create_app_webview(app_handle, &settings)?;
    let external_webview = create_external_webview(app_handle, &settings)?;

    add_webviews_to_window(&window, app_webview, external_webview, &geometry)?;

    Ok(())
}

fn create_main_window(
    app_handle: &tauri::AppHandle,
    geometry: &WindowGeometry,
) -> tauri::Result<tauri::Window> {
    WindowBuilder::new(app_handle, MAINWINDOW_LABEL)
        .resizable(true)
        .fullscreen(false)
        .title(app_handle.get_default_app_title())
        .position(geometry.x, geometry.y)
        .inner_size(geometry.width, geometry.height)
        .min_inner_size(MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT)
        .build()
}

fn create_app_webview(
    app_handle: &tauri::AppHandle,
    settings: &AppSettings,
) -> tauri::Result<WebviewBuilder<tauri::Wry>> {
    // auto resize is enabled
    // data directory is set to the app directory
    // disable tauri's drag and drop handler
    // incognito mode is enabled if the user settings is set to incognito
    let mut builder =
        WebviewBuilder::new(APP_WEBVIEW_LABEL, WebviewUrl::App(APP_WEBVIEW_URL.into()))
            .auto_resize()
            .data_directory(app_handle.get_app_dir())
            .disable_drag_drop_handler()
            .incognito(settings.incognito);

    #[cfg(target_os = "windows")]
    {
        if !settings.gpu_acceleration_enabled {
            builder = builder.additional_browser_args(
                "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --disable-gpu",
            );
        }
        // enable devtools on windows for release builds (need cargo feature `devtools`)
        builder = builder.devtools(true);
    }

    Ok(builder)
}

fn create_external_webview(
    app_handle: &tauri::AppHandle,
    settings: &AppSettings,
) -> tauri::Result<WebviewBuilder<tauri::Wry>> {
    let url = Url::parse(&settings.start_page_url)
        .unwrap_or_else(|_| Url::parse(default_start_page_url().as_str()).unwrap());

    let handle = app_handle.clone();

    // data directory is set to the app directory
    // disable tauri's drag and drop handler
    // incognito mode is enabled if the user settings is set to incognito
    let mut builder = WebviewBuilder::new(EXTERNAL_WEBVIEW_LABEL, WebviewUrl::External(url))
        .data_directory(app_handle.get_app_dir())
        .disable_drag_drop_handler()
        .incognito(settings.incognito)
        .on_navigation(move |url| {
            // This happens when the first navigation only, SPA navigations can't be captured by this
            handle
                .emit_to(
                    EventTarget::webview(APP_WEBVIEW_LABEL),
                    AppEvent::ExternalNavigation.as_ref(),
                    url.to_string(),
                )
                .ok();
            true
        });

    #[cfg(target_os = "windows")]
    if !settings.gpu_acceleration_enabled {
        builder = builder.additional_browser_args(
            "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --disable-gpu",
        );
    }

    Ok(builder)
}

fn add_webviews_to_window(
    window: &tauri::Window,
    app_webview: WebviewBuilder<tauri::Wry>,
    external_webview: WebviewBuilder<tauri::Wry>,
    geometry: &WindowGeometry,
) -> tauri::Result<()> {
    window.add_child(
        app_webview,
        LogicalPosition::new(0., 0.),
        LogicalSize::new(geometry.width, geometry.height),
    )?;

    window.add_child(
        external_webview,
        LogicalPosition::new(geometry.sidebar_width, geometry.header_height),
        LogicalSize::new(
            geometry.width - geometry.sidebar_width,
            geometry.height - geometry.header_height,
        ),
    )?;

    Ok(())
}

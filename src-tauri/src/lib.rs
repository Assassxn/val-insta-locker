mod commands;
mod config;
mod state;
mod valorant;

use commands::*;
use state::new_state;
use tauri::Manager;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

fn toggle_window(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        if w.is_visible().unwrap_or(false) {
            let _ = w.hide();
        } else {
            let _ = w.show();
            let _ = w.set_focus();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = new_state();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            connect,
            poll_phase,
            start_instalocker,
            cancel_instalocker,
            quit_pregame,
            get_agents,
            get_maps,
            get_config,
            save_config_cmd,
            set_map_macro,
            get_status,
            hide_to_tray,
        ])
        // Conditionally intercept close button based on hide_to_tray_on_close setting
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let hide = window
                    .app_handle()
                    .try_state::<state::AppState>()
                    .map(|s| {
                        let arc = (*s).clone();
                        arc.try_lock()
                            .map(|g| g.config.hide_to_tray_on_close)
                            .unwrap_or(true)
                    })
                    .unwrap_or(true);

                if hide {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            // System tray
            let toggle_item = MenuItem::with_id(app, "toggle", "Show / Hide", true, None::<&str>)?;
            let quit_item   = MenuItem::with_id(app, "quit",   "Quit",        true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle_item, &quit_item])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("ValLocker")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle" => toggle_window(app),
                    "quit"   => std::process::exit(0),
                    _        => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event {
                        toggle_window(tray.app_handle());
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

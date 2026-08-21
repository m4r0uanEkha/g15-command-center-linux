use tauri::{command, AppHandle, Emitter, State, Manager};
use tauri_plugin_shell::{ShellExt, process::CommandChild};
use std::sync::{Arc, Mutex};
use std::io::Write;

struct SidecarProcess {
    child: Arc<Mutex<Option<CommandChild>>>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn send_to_python(state: State<'_, SidecarProcess>, payload: serde_json::Value) -> Result<(), String> {
    let mut lock = state.child.lock().unwrap();
    if let Some(child) = lock.as_mut() {
        let json_string = serde_json::to_string(&payload)
            .map_err(|e| format!("JSON error: {}", e))?;
        
        child.write(format!("{}\n", json_string).as_bytes())
            .map_err(|e| format!("stdin error: {}", e))?;
        Ok(())
    } else {
        Err("The background Python process (sidecar) was not launched".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let child_process_storage = Arc::new(Mutex::new(None));
    let child_process_clone = child_process_storage.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(SidecarProcess { child: child_process_storage })
        .setup(move |app| {
            let app_handle = app.handle().clone();

            let (mut rx, child) = app.shell()
                .sidecar("main")
                .map_err(|e| format!("Binaire sidecar introuvable: {}", e))?
                .spawn()
                .map_err(|e| format!("Échec du lancement du Sidecar: {}", e))?;

            *child_process_clone.lock().unwrap() = Some(child);

            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    if let tauri_plugin_shell::process::CommandEvent::Stdout(bytes) = event {
                        if let Ok(text) = String::from_utf8(bytes) {
                            let _ = app_handle.emit("python-output", text);
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, send_to_python])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
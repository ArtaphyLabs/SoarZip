//! Tauri commands exposed to the frontend.
//! 暴露给前端的 Tauri 命令。

use tauri::{Window, AppHandle}; // Add AppHandle for commands needing it
use rfd::FileDialog;
use std::path::Path;

// Import struct and utils from sibling modules
use super::file_item::FileItem;
use super::archive_utils::{resolve_7z_path, run_7z_command, decode_7z_output, parse_7z_list_output};

// --- Window Commands --- 

/// Minimizes the application window.
/// 最小化应用程序窗口。
///
/// # Arguments
///
/// * `window` - The Tauri window instance.
///            - Tauri 窗口实例。
#[tauri::command]
pub fn minimize_window(window: Window) {
    if let Err(_e) = window.minimize() {
        crate::log_error!("Failed to minimize window: {}", _e);
    }
}

/// Maximizes or restores the application window.
/// 最大化或还原应用程序窗口。
///
/// # Arguments
///
/// * `window` - The Tauri window instance.
///            - Tauri 窗口实例。
#[tauri::command]
pub fn maximize_window(window: Window) {
    match window.is_maximized() {
        Ok(true) => {
            // If maximized, unmaximize (restore)
            if let Err(_e) = window.unmaximize() {
                crate::log_error!("Failed to restore window: {}", _e);
            }
        }
        Ok(false) => {
             // If not maximized, maximize
            if let Err(_e) = window.maximize() {
                crate::log_error!("Failed to maximize window: {}", _e);
            }
        }
        Err(_e) => {
            crate::log_error!("Failed to get window state: {}", _e)
        },
    }
}

/// Closes the application window.
/// 关闭应用程序窗口。
///
/// # Arguments
///
/// * `window` - The Tauri window instance.
///            - Tauri 窗口实例。
#[tauri::command]
pub fn close_window(window: Window) {
    if let Err(_e) = window.close() {
        crate::log_error!("Failed to close window: {}", _e);
    }
}

/// Sets the title of the application window.
/// 设置应用程序窗口的标题。
///
/// # Arguments
///
/// * `window` - The Tauri window instance.
///            - Tauri 窗口实例。
/// * `title`  - The desired window title.
///            - 期望的窗口标题。
///
/// # Returns
///
/// * `Ok(())` - If the title was set successfully.
///              - 如果标题设置成功。
/// * `Err(String)` - An error message if setting the title failed.
///                 - 如果设置标题失败，则返回错误消息。
#[tauri::command]
pub fn set_window_title(window: Window, title: String) -> Result<(), String> {
    match window.set_title(&title) {
        Ok(_) => {
            crate::log_info!("Window title set to: {}", title);
            Ok(())
        },
        Err(e) => {
            let error_msg = format!("Error setting window title: {}", e);
            crate::log_error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

// --- File/Folder Dialog Commands --- 

/// Opens a file dialog for selecting an archive file.
/// Allowed extensions: zip, rar, 7z, tar, gz.
/// 打开文件对话框以选择压缩文件。
/// 允许的扩展名：zip, rar, 7z, tar, gz。
///
/// # Returns
///
/// * `Some(String)` - The selected archive file path, if a file was chosen.
///                    - 如果选择了文件，则返回所选压缩文件的路径。
/// * `None` - If the dialog was cancelled.
///          - 如果对话框被取消。
#[tauri::command]
pub fn select_archive_file() -> Option<String> {
    crate::log_info!("Opening archive selection dialog.");
    // Use rfd library to open the file selection dialog
    let file = FileDialog::new()
        .add_filter("Archive Files", &["zip", "rar", "7z", "tar", "gz", "bz2"])
        .pick_file();

    match file {
        Some(path_buf) => {
            let path_str = path_buf.to_string_lossy().to_string();
            crate::log_info!("Archive selected: {}", path_str);
            Some(path_str)
        },
        None => {
            crate::log_info!("Archive selection cancelled.");
            None
        }
    }
}

/// Opens a folder dialog for selecting a destination directory.
/// 打开文件夹对话框以选择目标目录。
///
/// # Returns
///
/// * `Some(String)` - The selected folder path, if a folder was chosen.
///                    - 如果选择了文件夹，则返回所选文件夹的路径。
/// * `None` - If the dialog was cancelled.
///          - 如果对话框被取消。
#[tauri::command]
pub fn select_destination_folder() -> Option<String> {
    crate::log_info!("Opening destination folder selection dialog.");
    let folder = FileDialog::new().pick_folder();
    match folder {
        Some(path_buf) => {
            let path_str = path_buf.to_string_lossy().to_string();
            crate::log_info!("Destination folder selected: {}", path_str);
            Some(path_str)
        },
        None => {
            crate::log_info!("Destination folder selection cancelled.");
            None
        }
    }
}

// --- Archive Operation Commands --- 

/// Opens an archive file and lists its contents using the bundled 7-Zip.
/// 使用捆绑的 7-Zip 打开压缩文件并列出其内容。
///
/// # Arguments
///
/// * `app_handle`   - The Tauri application handle (injected automatically).
///                  - Tauri 应用程序句柄（自动注入）。
/// * `archive_path` - The path to the archive file.
///                  - 压缩文件的路径。
///
/// # Returns
///
/// * `Ok(Vec<FileItem>)` - A vector of items found in the archive.
///                         - 在压缩包中找到的项目向量。
/// * `Err(String)` - An error message if opening or parsing fails.
///                 - 如果打开或解析失败，则返回错误消息。
#[tauri::command]
pub fn open_archive(app_handle: AppHandle, archive_path: String) -> Result<Vec<FileItem>, String> {
    crate::log_info!("Attempting to open archive: {}", archive_path);

    // Check if the archive file exists
    if !Path::new(&archive_path).exists() {
        let error_msg = format!("Archive file not found: {}", archive_path);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // Resolve the path to the bundled 7-Zip executable
    let seven_zip_path = resolve_7z_path(&app_handle)?;
    crate::log_info!("Using bundled 7-Zip at: {:?}", seven_zip_path);

    // Prepare arguments for 7-Zip list command (detailed list)
    let args = vec!["l".to_string(), "-slt".to_string(), archive_path.clone()];

    // Execute the 7-Zip command
    let output = run_7z_command(&seven_zip_path, &args)?;

    // Check if the 7-Zip command executed successfully (exit code 0)
    if !output.status.success() {
        let stderr_output = decode_7z_output(&output.stderr);
        let error_msg = format!(
            "Bundled 7-Zip list command failed with exit code: {}. Error: {}",
            output.status.code().unwrap_or(-1),
            stderr_output.trim()
        );
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // Decode the stdout
    let stdout_output = decode_7z_output(&output.stdout);

    // Parse the decoded output
    let files = parse_7z_list_output(&stdout_output);

    crate::log_info!("Successfully listed archive: {}", archive_path);
    Ok(files)
}

/// Extracts specified files or all files from an archive to a destination directory.
/// Uses the bundled 7-Zip executable.
/// 将指定文件或所有文件从压缩包解压到目标目录。
/// 使用捆绑的 7-Zip 可执行文件。
///
/// # Arguments
///
/// * `app_handle`       - The Tauri application handle (injected automatically).
///                      - Tauri 应用程序句柄（自动注入）。
/// * `archive_path`     - The path to the archive file.
///                      - 压缩文件的路径。
/// * `files_to_extract` - A vector of relative paths within the archive to extract. If empty, extracts all.
///                      - 要解压的压缩包内相对路径的向量。如果为空，则解压所有文件。
/// * `output_directory` - The destination directory where files will be extracted.
///                      - 文件将被解压到的目标目录。
///
/// # Returns
///
/// * `Ok(())` - If the extraction was successful.
///              - 如果解压成功。
/// * `Err(String)` - An error message if extraction fails.
///                 - 如果解压失败，则返回错误消息。
#[tauri::command]
pub fn extract_files(
    app_handle: AppHandle,
    archive_path: String,
    files_to_extract: Vec<String>, // List of relative paths inside the archive
    output_directory: String,
) -> Result<(), String> {
    crate::log_info!(
        "Starting extraction to: {}, Archive: {}",
        output_directory, archive_path
    );
    if !files_to_extract.is_empty() {
        crate::log_info!("Files/folders to extract: {:?}", files_to_extract);
    } else {
        crate::log_info!("Extracting all contents.");
    }

    // Check if archive file exists
    if !Path::new(&archive_path).exists() {
        let error_msg = format!("Archive file not found: {}", archive_path);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // Check if output directory exists, create if not
    let output_path = Path::new(&output_directory);
    if !output_path.exists() {
        crate::log_info!("Output directory does not exist, attempting to create: {}", output_directory);
        if let Err(e) = std::fs::create_dir_all(output_path) {
            let error_msg = format!("Failed to create output directory '{}': {}", output_directory, e);
            crate::log_error!("{}", error_msg);
            return Err(error_msg);
        }
        crate::log_info!("Successfully created output directory: {}", output_directory);
    } else if !output_path.is_dir() {
         // Ensure the output path is actually a directory
         let error_msg = format!("Output path exists but is not a directory: {}", output_directory);
         crate::log_error!("{}", error_msg);
         return Err(error_msg);
    }

    // Resolve 7-Zip path
    let seven_zip_path = resolve_7z_path(&app_handle)?;
    crate::log_info!("Using bundled 7-Zip for extraction: {:?}", seven_zip_path);

    // Build 7-Zip command arguments
    // Base command: 7z x <archive_path> -o<output_directory> [files_to_extract...] -aoa
    // 'x': Extract files with full paths
    // '-o': Specify output directory (no space after -o)
    // 'files_to_extract...': Optional list of files/dirs to extract (relative paths)
    // '-aoa': Overwrite All existing files without prompt.
    let mut args = vec![
        "x".to_string(),                // Extract command
        archive_path.clone(),       // Archive path
        format!("-o{}", output_directory), // Output directory (no space!)
        "-aoa".to_string(),             // Overwrite mode: Overwrite All files Always
    ];

    // Add specific files/folders to the arguments if provided
    // 7-Zip generally handles '/' separators well, even on Windows
    if !files_to_extract.is_empty() {
        for file in files_to_extract {
             args.push(file);
        }
    }

    // Execute the 7-Zip extraction command
    let output = run_7z_command(&seven_zip_path, &args)?;

    // Check the result of the 7-Zip command
    if !output.status.success() {
        let stderr_output = decode_7z_output(&output.stderr);
        let error_msg = format!(
            "Bundled 7-Zip extract command failed with exit code: {}. Error: {}",
            output.status.code().unwrap_or(-1),
            stderr_output.trim()
        );
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // Log success and potentially some output
    let stdout_output = decode_7z_output(&output.stdout);
    crate::log_info!("Bundled 7-Zip extract command executed successfully.");
    if !stdout_output.is_empty() {
         if stdout_output.len() < 500 { // Log short output fully
             crate::log_info!("7-Zip output: {}", stdout_output.trim());
         } else { // Log length for long output
             crate::log_info!("7-Zip output length: {}", stdout_output.len());
         }
    } else {
        crate::log_info!("7-Zip produced no output on stdout.");
    }

    Ok(())
} 
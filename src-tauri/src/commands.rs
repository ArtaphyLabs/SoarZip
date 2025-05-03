#![allow(unused)]
//! Tauri commands exposed to the frontend.
//! 暴露给前端的 Tauri 命令。

use tauri::{Window, AppHandle}; // Add AppHandle for commands needing it
use rfd::FileDialog;
use std::path::Path;

// Update import paths
use crate::models::file_item::FileItem;
use crate::utils::archive_utils::{resolve_7z_path, run_7z_command, decode_7z_output, parse_7z_list_output};

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

/// Opens a file dialog for selecting multiple files to add to an archive.
/// 打开文件对话框以选择要添加到压缩包的多个文件。
///
/// # Returns
///
/// * `Some(Vec<String>)` - A vector of file paths if files were selected.
///                        - 如果选择了文件，则返回文件路径向量。
/// * `None` - If the dialog was cancelled.
///          - 如果对话框被取消。
#[tauri::command]
pub fn select_files_to_add() -> Option<Vec<String>> {
    crate::log_info!("Opening file selection dialog for adding files.");
    
    let files = FileDialog::new()
        .set_title("选择要添加的文件")
        .pick_files();
    
    match files {
        Some(paths) => {
            let path_strings: Vec<String> = paths.iter()
                .map(|p| p.to_string_lossy().to_string())
                .collect();
            
            crate::log_info!("Selected {} files to add", path_strings.len());
            Some(path_strings)
        },
        None => {
            crate::log_info!("File selection cancelled.");
            None
        }
    }
}

/// Opens a folder dialog for selecting multiple folders to add to an archive.
/// 打开文件夹对话框以选择要添加到压缩包的多个文件夹。
///
/// # Returns
///
/// * `Some(Vec<String>)` - A vector of folder paths if folders were selected.
///                        - 如果选择了文件夹，则返回文件夹路径向量。
/// * `None` - If the dialog was cancelled.
///          - 如果对话框被取消。
#[tauri::command]
pub fn select_folders_to_add() -> Option<Vec<String>> {
    crate::log_info!("Opening folder selection dialog for adding folders.");
    
    let folders = FileDialog::new()
        .set_title("选择要添加的文件夹")
        .pick_folders();
    
    match folders {
        Some(paths) => {
            let path_strings: Vec<String> = paths.iter()
                .map(|p| p.to_string_lossy().to_string())
                .collect();
            
            crate::log_info!("Selected {} folders to add", path_strings.len());
            Some(path_strings)
        },
        None => {
            crate::log_info!("Folder selection cancelled.");
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

/// Creates a new empty archive file.
/// 创建一个新的空压缩文件。
///
/// # Arguments
///
/// * `app_handle`    - The Tauri application handle (injected automatically).
///                   - Tauri 应用程序句柄（自动注入）。
/// * `archive_path`  - The desired path for the new archive.
///                   - 新压缩文件的所需路径。
/// * `archive_type`  - The type of archive to create (e.g., "zip", "7z").
///                   - 要创建的压缩文件类型（例如，"zip"，"7z"）。
///
/// # Returns
///
/// * `Ok(String)` - The path to the created archive.
///                - 创建的压缩文件的路径。
/// * `Err(String)` - An error message if the operation fails.
///                 - 如果操作失败，则返回错误消息。
#[tauri::command]
pub fn create_new_archive(app_handle: AppHandle, archive_path: String, archive_type: String) -> Result<String, String> {
    crate::log_info!("Creating new {} archive at: {}", archive_type, archive_path);

    // Check if the file already exists
    if Path::new(&archive_path).exists() {
        let error_msg = format!("File already exists at the specified path: {}", archive_path);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // Resolve the path to the bundled 7-Zip executable
    let seven_zip_path = resolve_7z_path(&app_handle)?;

    // 创建一个临时空文件，用于创建空压缩包
    let empty_file_path = std::env::temp_dir().join("soarzip_empty.tmp");
    
    // 创建空文件（文件大小为0字节）
    if let Err(e) = std::fs::write(&empty_file_path, b"") {
        let error_msg = format!("无法创建临时文件: {}", e);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // Prepare 7z command to create a new archive
    let archive_format = format!("-t{}", archive_type);
    
    // 简单的参数组合 - 直接将空文件加入压缩包然后删除它
    let mut args = vec![
        "a".to_string(),      // 添加命令
        archive_format,       // 指定压缩格式
        "-y".to_string(),     // 自动回答是
    ];
    
    // Some formats might need specific compression method settings
    if archive_type == "7z" {
        args.push("-mx=9".to_string()); // Use maximum compression for 7z
    }
    
    // 将目标压缩包路径添加到命令中
    args.push(archive_path.clone());
    
    // 添加临时空文件路径
    args.push(empty_file_path.to_string_lossy().to_string());
    
    // 记录执行的命令
    crate::log_info!("Creating empty archive with command: {:?}", args);
    
    // Execute the 7-Zip command
    let result = match run_7z_command(&seven_zip_path, &args) {
        Ok(output) => {
            if !output.status.success() {
                let error_msg = format!("Failed to create archive: {}", decode_7z_output(&output.stderr));
                crate::log_error!("{}", error_msg);
                Err(error_msg)
            } else {
                crate::log_info!("Successfully created archive with empty file");
                
                // 现在创建了包含空文件的压缩包，我们需要删除这个空文件
                // 打开压缩包并删除内部的空文件
                let delete_args = vec![
                    "d".to_string(),       // 删除命令
                    archive_path.clone(),  // 压缩包路径
                    "soarzip_empty.tmp".to_string(), // 要删除的文件
                    "-y".to_string(),      // 自动回答是
                ];
                
                match run_7z_command(&seven_zip_path, &delete_args) {
                    Ok(del_output) => {
                        if !del_output.status.success() {
                            let error_msg = format!("创建压缩包后未能删除临时文件: {}", decode_7z_output(&del_output.stderr));
                            crate::log_error!("{}", error_msg);
                            let _ = std::fs::remove_file(&empty_file_path); // 尝试清理本地临时文件
                            return Err(error_msg);
                        } else {
                            crate::log_info!("Successfully removed temporary file from archive");
                        }
                    },
                    Err(e) => {
                        let error_msg = format!("执行删除临时文件命令时出错: {}", e);
                        crate::log_error!("{}", error_msg);
                        let _ = std::fs::remove_file(&empty_file_path); // 尝试清理本地临时文件
                        return Err(error_msg);
                    }
                }
                
                crate::log_info!("Successfully created empty archive at: {}", archive_path);
                Ok(archive_path)
            }
        },
        Err(e) => {
            let error_msg = format!("Failed to execute 7-Zip command: {}", e);
            crate::log_error!("{}", error_msg);
            Err(error_msg)
        }
    };
    
    // 删除临时文件
    if let Err(e) = std::fs::remove_file(&empty_file_path) {
        crate::log_error!("Warning: Failed to remove temporary file: {}", e);
        // 不影响结果，所以继续
    }
    
    result
}

/// Opens a file dialog for selecting a path and name for a new archive file.
/// 打开文件对话框，用于选择新压缩文件的路径和名称。
///
/// # Arguments
///
/// * `default_name` - The default filename to suggest in the dialog.
///                  - 在对话框中建议的默认文件名。
/// * `archive_type` - The type of archive to create (e.g., "zip", "7z").
///                  - 要创建的压缩文件类型（例如，"zip"，"7z"）。
///
/// # Returns
///
/// * `Some(String)` - The selected path for the new archive, if a path was chosen.
///                  - 如果选择了路径，则返回新压缩文件的所选路径。
/// * `None` - If the dialog was cancelled.
///          - 如果对话框被取消。
#[tauri::command]
pub fn select_new_archive_path(default_name: String, archive_type: String) -> Option<String> {
    crate::log_info!("Opening new archive path selection dialog.");
    
    // Determine the file extension based on the archive type
    let extension = match archive_type.as_str() {
        "zip" => "zip",
        "7z" => "7z",
        "tar" => "tar",
        "gzip" => "gz",
        "bzip2" => "bz2",
        _ => archive_type.as_str(), // Use the archive_type as extension for other types
    };
    
    // Use rfd library to open the file save dialog
    let file = FileDialog::new()
        .set_file_name(&format!("{}.{}", default_name, extension))
        .add_filter("Archive Files", &[extension])
        .save_file();

    match file {
        Some(path_buf) => {
            let path_str = path_buf.to_string_lossy().to_string();
            crate::log_info!("New archive path selected: {}", path_str);
            Some(path_str)
        },
        None => {
            crate::log_info!("New archive path selection cancelled.");
            None
        }
    }
}

/// Adds files to an existing archive.
/// 向现有压缩包添加文件。
///
/// # Arguments
///
/// * `app_handle`   - The Tauri application handle (injected automatically).
///                  - Tauri 应用程序句柄（自动注入）。
/// * `archive_path` - The path to the existing archive.
///                  - 现有压缩包的路径。
/// * `file_paths`   - A vector of file paths to add to the archive.
///                  - 要添加到压缩包的文件路径向量。
///
/// # Returns
///
/// * `Ok(())` - If the files were successfully added.
///            - 如果文件添加成功。
/// * `Err(String)` - An error message if the operation fails.
///                 - 如果操作失败，则返回错误消息。
#[tauri::command]
pub fn add_files_to_archive(
    app_handle: AppHandle,
    archive_path: String,
    file_paths: Vec<String>
) -> Result<(), String> {
    if file_paths.is_empty() {
        return Ok(());
    }

    crate::log_info!(
        "Adding {} files to archive: {}",
        file_paths.len(), archive_path
    );

    // Check if archive exists
    if !Path::new(&archive_path).exists() {
        let error_msg = format!("Archive file not found: {}", archive_path);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // Resolve 7-Zip path
    let seven_zip_path = resolve_7z_path(&app_handle)?;
    crate::log_info!("Using bundled 7-Zip at: {:?}", seven_zip_path);

    // Build 7-Zip command arguments for adding files
    // 7z a <archive_path> <file1> <file2> ... -y
    let mut args = vec![
        "a".to_string(),           // Add command
        archive_path.clone(),     // Archive path
        "-y".to_string(),         // Auto-yes to all queries
    ];

    // Add all file paths to arguments
    for file_path in file_paths.iter() {
        args.push(file_path.clone());
    }

    // Execute the 7-Zip command
    let output = run_7z_command(&seven_zip_path, &args)?;

    // Check if the command was successful
    if !output.status.success() {
        let stderr_output = decode_7z_output(&output.stderr);
        let error_msg = format!(
            "Failed to add files to archive. Exit code: {}. Error: {}",
            output.status.code().unwrap_or(-1),
            stderr_output.trim()
        );
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    crate::log_info!("Successfully added files to archive: {}", archive_path);
    Ok(())
}

/// Deletes files or folders from an archive.
/// 从压缩包中删除文件或文件夹。
///
/// # Arguments
///
/// * `app_handle`   - The Tauri application handle (injected automatically).
///                  - Tauri 应用程序句柄（自动注入）。
/// * `archive_path` - The path to the archive file.
///                  - 压缩包文件的路径。
/// * `files`        - A vector of file/folder paths within the archive to delete.
///                  - 要删除的压缩包内文件/文件夹路径的向量。
///
/// # Returns
///
/// * `Ok(())` - If the deletion was successful.
///            - 如果删除成功。
/// * `Err(String)` - An error message if the operation fails.
///                 - 如果操作失败，则返回错误消息。
#[tauri::command]
pub fn delete_files_in_archive(
    app_handle: AppHandle,
    archive_path: String,
    files: Vec<String>
) -> Result<(), String> {
    if files.is_empty() {
        return Ok(());
    }

    crate::log_info!(
        "Deleting {} files/folders from archive: {}",
        files.len(), archive_path
    );

    // Check if archive exists
    if !Path::new(&archive_path).exists() {
        let error_msg = format!("Archive file not found: {}", archive_path);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // Resolve 7-Zip path
    let seven_zip_path = resolve_7z_path(&app_handle)?;
    crate::log_info!("Using bundled 7-Zip at: {:?}", seven_zip_path);

    // Build 7-Zip command arguments for deleting files
    // 7z d <archive_path> <file1> <file2> ... -y
    let mut args = vec![
        "d".to_string(),           // Delete command
        archive_path.clone(),     // Archive path
        "-y".to_string(),         // Auto-yes to all queries
    ];

    // Add all file paths to arguments
    for file_path in files.iter() {
        args.push(file_path.clone());
    }

    // Execute the 7-Zip command
    let output = run_7z_command(&seven_zip_path, &args)?;

    // Check if the command was successful
    if !output.status.success() {
        let stderr_output = decode_7z_output(&output.stderr);
        let error_msg = format!(
            "Failed to delete files from archive. Exit code: {}. Error: {}",
            output.status.code().unwrap_or(-1),
            stderr_output.trim()
        );
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    crate::log_info!("Successfully deleted files from archive: {}", archive_path);
    Ok(())
}

/// Creates a new folder in an archive.
/// 在压缩包中创建一个新文件夹。
///
/// # Arguments
///
/// * `app_handle`   - The Tauri application handle (injected automatically).
///                  - Tauri 应用程序句柄（自动注入）。
/// * `archive_path` - The path to the archive file.
///                  - 压缩包文件的路径。
/// * `folder_path`  - The path for the new folder within the archive.
///                  - 压缩包内新文件夹的路径。
///
/// # Returns
///
/// * `Ok(())` - If the folder was successfully created.
///            - 如果文件夹创建成功。
/// * `Err(String)` - An error message if the operation fails.
///                 - 如果操作失败，则返回错误消息。
#[tauri::command]
pub fn create_folder_in_archive(
    app_handle: AppHandle,
    archive_path: String,
    folder_path: String
) -> Result<(), String> {
    crate::log_info!(
        "Creating folder '{}' in archive: {}",
        folder_path, archive_path
    );

    // Ensure folder path is not empty, doesn't contain invalid chars, and ends with a slash for clarity
    let clean_folder_path = folder_path.trim().trim_matches(|c| c == '/' || c == '\\');
    if clean_folder_path.is_empty() || clean_folder_path.contains("..") {
        let error_msg = format!("Invalid folder path provided: {}", folder_path);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }
    let folder_path_with_slash = format!("{}/", clean_folder_path); // Ensure trailing slash

    // Check if archive exists
    if !Path::new(&archive_path).exists() {
        let error_msg = format!("Archive file not found: {}", archive_path);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // Resolve 7-Zip path
    let seven_zip_path = resolve_7z_path(&app_handle)?;
    crate::log_info!("Using bundled 7-Zip at: {:?}", seven_zip_path);

    // 方法1：直接使用空内容创建文件夹
    // 创建一个空的内存文件
    let empty_content = "";
    
    // 构建命令以直接添加文件夹
    let add_dir_args = vec![
        "a".to_string(),                       // Add command
        archive_path.clone(),                 // Archive path
        "-tzip".to_string(),                  // 使用ZIP格式
        "-si".to_string(),                    // 从标准输入读取
        format!("-w."),                       // 工作目录
        folder_path_with_slash.clone(),       // 文件夹路径（含斜杠）
        "-y".to_string(),                     // 自动回答是
    ];

    crate::log_info!("Creating directory using direct method: {:?}", add_dir_args);
    
    // 使用Command自定义标准输入
    let mut child = std::process::Command::new(&seven_zip_path)
        .args(&add_dir_args)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn 7z process: {}", e))?;
    
    // 写入空内容到标准输入
    if let Some(mut stdin) = child.stdin.take() {
        use std::io::Write;
        if let Err(e) = stdin.write_all(empty_content.as_bytes()) {
            crate::log_error!("Failed to write to stdin: {}", e);
            // 继续尝试其他方法
        }
    }
    
    // 等待进程完成
    let output = child.wait_with_output()
        .map_err(|e| format!("Failed to wait for 7z process: {}", e))?;
    
    if output.status.success() {
        crate::log_info!("Successfully created folder '{}' in archive: {}", folder_path_with_slash, archive_path);
        return Ok(());
    }
    
    // 如果第一种方法失败，使用第二种备用方法
    crate::log_info!("First method failed, trying alternative method with placeholder file...");
    
    // Create a unique temporary file name
    let placeholder_name = ".soarzip_placeholder";
    let placeholder_path_in_archive = format!("{}{}", folder_path_with_slash, placeholder_name);

    // Create an empty temporary file locally
    let temp_dir = std::env::temp_dir();
    let local_placeholder_path = temp_dir.join(placeholder_name);
    if let Err(e) = std::fs::write(&local_placeholder_path, b"") {
        let error_msg = format!("Failed to create temporary placeholder file: {}", e);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // Build 7-Zip command arguments to add the placeholder file with its full path
    let add_args = vec![
        "a".to_string(),                       // Add command
        archive_path.clone(),                 // Archive path
        local_placeholder_path.to_string_lossy().to_string(), // Local file to add
        format!("-w{}", temp_dir.to_string_lossy()), // 工作目录
        format!("-i!{}", placeholder_name),   // 只包含此文件
        format!("-sa={}", placeholder_path_in_archive), // 在归档中指定名称
        "-y".to_string(),                     // Auto-yes to all queries
    ];

    // Execute the 7-Zip command to add the placeholder
    crate::log_info!("Adding placeholder: {:?}", add_args);
    let output = run_7z_command(&seven_zip_path, &add_args)?;

    // Clean up the local temporary file
    let _ = std::fs::remove_file(&local_placeholder_path);

    if !output.status.success() {
        let stderr_output = decode_7z_output(&output.stderr);
        let error_msg = format!(
            "Failed to add placeholder file '{}' to archive. Exit code: {}. Error: {}",
            placeholder_path_in_archive, output.status.code().unwrap_or(-1), stderr_output.trim()
        );
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }
    crate::log_info!("Placeholder added successfully.");

    // Now delete the placeholder file from the archive
    let delete_args = vec![
        "d".to_string(),                    // Delete command
        archive_path.clone(),               // Archive path
        placeholder_path_in_archive.clone(), // Placeholder file path in archive to delete
        "-y".to_string(),                   // Auto-yes to all queries
    ];

    crate::log_info!("Deleting placeholder: {:?}", delete_args);
    let output = run_7z_command(&seven_zip_path, &delete_args)?;

    if !output.status.success() {
        let stderr_output = decode_7z_output(&output.stderr);
        // Log a warning, but don't fail the whole operation if only placeholder deletion failed
        crate::log_warn!(
            "Warning: Successfully created folder '{}', but failed to remove placeholder file '{}' from archive. Exit code: {}. Error: {}",
            folder_path_with_slash, placeholder_path_in_archive, output.status.code().unwrap_or(-1), stderr_output.trim()
        );
    } else {
        crate::log_info!("Placeholder deleted successfully.");
    }

    crate::log_info!("Successfully processed folder creation for '{}' in archive: {}", folder_path_with_slash, archive_path);
    Ok(())
}

/// Renames a file or folder within an archive.
/// 重命名压缩包内的文件或文件夹。
///
/// # Arguments
///
/// * `app_handle`   - The Tauri application handle (injected automatically).
///                  - Tauri 应用程序句柄（自动注入）。
/// * `archive_path` - The path to the archive file.
///                  - 压缩包文件的路径。
/// * `old_path`     - The current path of the file/folder within the archive.
///                  - 文件/文件夹在压缩包内的当前路径。
/// * `new_name`     - The new name for the file/folder (without path).
///                  - 文件/文件夹的新名称（不包含路径）。
///
/// # Returns
///
/// * `Ok(())` - If the rename was successful.
///            - 如果重命名成功。
/// * `Err(String)` - An error message if the operation fails.
///                 - 如果操作失败，则返回错误消息。
#[tauri::command]
pub fn rename_file_in_archive(
    app_handle: AppHandle,
    archive_path: String,
    old_path: String,
    new_name: String
) -> Result<(), String> {
    crate::log_info!(
        "Renaming '{}' to '{}' in archive: {}",
        old_path, new_name, archive_path
    );

    // Check if archive exists
    if !Path::new(&archive_path).exists() {
        let error_msg = format!("Archive file not found: {}", archive_path);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // 计算新路径：保留原始路径的目录部分，更改文件名
    let old_parts: Vec<&str> = old_path.rsplitn(2, '/').collect();
    let new_path = if old_parts.len() > 1 {
        // 有目录部分，保留目录
        format!("{}/{}", old_parts[1], new_name)
    } else {
        // 无目录部分，仅文件名
        new_name.clone()
    };

    // 创建临时目录用于解压和重新压缩
    let temp_dir = std::env::temp_dir().join("soarzip_rename_temp");
    if temp_dir.exists() {
        if let Err(e) = std::fs::remove_dir_all(&temp_dir) {
            let error_msg = format!("Failed to clean up existing temp directory: {}", e);
            crate::log_error!("{}", error_msg);
            return Err(error_msg);
        }
    }
    
    if let Err(e) = std::fs::create_dir_all(&temp_dir) {
        let error_msg = format!("Failed to create temp directory: {}", e);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // 解决7-Zip路径
    let seven_zip_path = resolve_7z_path(&app_handle)?;
    crate::log_info!("Using bundled 7-Zip at: {:?}", seven_zip_path);

    // 步骤1：提取要重命名的文件到临时目录
    let extract_args = vec![
        "e".to_string(),                // Extract command (without paths)
        archive_path.clone(),           // Archive path
        old_path.clone(),               // File to extract
        format!("-o{}", temp_dir.to_string_lossy()), // Output directory
        "-y".to_string(),               // Auto-yes to all queries
    ];

    let output = run_7z_command(&seven_zip_path, &extract_args)?;
    if !output.status.success() {
        let stderr_output = decode_7z_output(&output.stderr);
        let error_msg = format!(
            "Failed to extract file for renaming. Exit code: {}. Error: {}",
            output.status.code().unwrap_or(-1),
            stderr_output.trim()
        );
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // 步骤2：从原始压缩包中删除旧文件
    let delete_args = vec![
        "d".to_string(),              // Delete command
        archive_path.clone(),         // Archive path
        old_path.clone(),             // File to delete
        "-y".to_string(),             // Auto-yes to all queries
    ];

    let output = run_7z_command(&seven_zip_path, &delete_args)?;
    if !output.status.success() {
        let stderr_output = decode_7z_output(&output.stderr);
        let error_msg = format!(
            "Failed to delete original file. Exit code: {}. Error: {}",
            output.status.code().unwrap_or(-1),
            stderr_output.trim()
        );
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // 步骤3：重命名临时目录中的文件
    let old_file_name = old_path.split('/').last().unwrap_or(&old_path);
    let old_file_path = temp_dir.join(old_file_name);
    let new_file_path = temp_dir.join(new_name.clone());
    
    if let Err(e) = std::fs::rename(&old_file_path, &new_file_path) {
        let error_msg = format!("Failed to rename file in temp directory: {}", e);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // 步骤4：将重命名后的文件添加回压缩包
    let new_path_in_archive = if old_parts.len() > 1 {
        format!("{}/{}", old_parts[1], new_name)
    } else {
        new_name
    };

    let add_args = vec![
        "a".to_string(),                // Add command
        archive_path,                   // Archive path
        new_file_path.to_string_lossy().to_string(), // File to add
        format!("-w{}", temp_dir.to_string_lossy()), // Working directory
        "-y".to_string(),               // Auto-yes to all queries
    ];

    let output = run_7z_command(&seven_zip_path, &add_args)?;
    
    // 清理临时目录
    if let Err(e) = std::fs::remove_dir_all(&temp_dir) {
        crate::log_error!("Warning: Failed to clean up temp directory: {}", e);
        // 继续执行，不影响主要功能
    }

    if !output.status.success() {
        let stderr_output = decode_7z_output(&output.stderr);
        let error_msg = format!(
            "Failed to add renamed file back to archive. Exit code: {}. Error: {}",
            output.status.code().unwrap_or(-1),
            stderr_output.trim()
        );
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    crate::log_info!("Successfully renamed file in archive to: {}", new_path_in_archive);
    Ok(())
}

/// Moves files or folders to a different location within an archive.
/// 将文件或文件夹移动到压缩包中的不同位置。
///
/// # Arguments
///
/// * `app_handle`   - The Tauri application handle (injected automatically).
///                  - Tauri 应用程序句柄（自动注入）。
/// * `archive_path` - The path to the archive file.
///                  - 压缩包文件的路径。
/// * `files`        - A vector of file/folder paths within the archive to move.
///                  - 要移动的压缩包内文件/文件夹路径的向量。
/// * `destination`  - The destination directory path within the archive.
///                  - 压缩包内的目标目录路径。
///
/// # Returns
///
/// * `Ok(())` - If the move operation was successful.
///            - 如果移动操作成功。
/// * `Err(String)` - An error message if the operation fails.
///                 - 如果操作失败，则返回错误消息。
#[tauri::command]
pub fn move_files_in_archive(
    app_handle: AppHandle,
    archive_path: String,
    files: Vec<String>,
    destination: String
) -> Result<(), String> {
    if files.is_empty() {
        return Ok(());
    }

    crate::log_info!(
        "Moving {} files/folders to '{}' in archive: {}",
        files.len(), destination, archive_path
    );

    // 创建临时目录用于解压和重新压缩
    let temp_dir = std::env::temp_dir().join("soarzip_move_temp");
    if temp_dir.exists() {
        if let Err(e) = std::fs::remove_dir_all(&temp_dir) {
            let error_msg = format!("Failed to clean up existing temp directory: {}", e);
            crate::log_error!("{}", error_msg);
            return Err(error_msg);
        }
    }
    
    if let Err(e) = std::fs::create_dir_all(&temp_dir) {
        let error_msg = format!("Failed to create temp directory: {}", e);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // 解决7-Zip路径
    let seven_zip_path = resolve_7z_path(&app_handle)?;
    crate::log_info!("Using bundled 7-Zip at: {:?}", seven_zip_path);

    // 对每个文件执行提取-重命名-添加-删除操作
    for file_path in &files {
        // 获取文件名（不包括路径）
        let file_name = file_path.split('/').last().unwrap_or(file_path);
        
        // 计算新路径
        let new_path = if destination.is_empty() {
            file_name.to_string()
        } else {
            format!("{}/{}", destination.trim_end_matches('/'), file_name)
        };
        
        // 跳过相同路径的文件
        if *file_path == new_path {
            continue;
        }

        // 步骤1：提取文件到临时目录
        let extract_args = vec![
            "e".to_string(),                // Extract command
            archive_path.clone(),           // Archive path
            file_path.clone(),              // File to extract
            format!("-o{}", temp_dir.to_string_lossy()), // Output directory
            "-y".to_string(),               // Auto-yes to all queries
        ];

        let output = run_7z_command(&seven_zip_path, &extract_args)?;
        if !output.status.success() {
            let stderr_output = decode_7z_output(&output.stderr);
            let error_msg = format!(
                "Failed to extract file '{}' for moving. Exit code: {}. Error: {}",
                file_path, output.status.code().unwrap_or(-1), stderr_output.trim()
            );
            crate::log_error!("{}", error_msg);
            return Err(error_msg);
        }

        // 步骤2：将文件以新路径添加回压缩包
        let temp_file_path = temp_dir.join(file_name);
        
        // 确保目标目录存在
        if !destination.is_empty() {
            // 创建中间目录结构
            let dir_args = vec![
                "a".to_string(),            // Add command
                archive_path.clone(),       // Archive path
                "-tzip".to_string(),        // Force ZIP format
                format!("-si{}", destination), // Set name inside archive
                "-y".to_string(),           // Auto-yes to all queries
            ];
            
            // 使用空输入流创建目录结构
            let mut child = std::process::Command::new(&seven_zip_path)
                .args(&dir_args)
                .stdin(std::process::Stdio::piped())
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped())
                .spawn()
                .map_err(|e| format!("Failed to spawn 7z process: {}", e))?;
                
            // 关闭子进程 stdin 管道以避免资源泄露
            child.stdin = None;
            
            let output = child.wait_with_output()
                .map_err(|e| format!("Failed to wait for 7z process: {}", e))?;
                
            if !output.status.success() {
                crate::log_warn!("Warning: Creating directory structure may have failed, but we'll continue anyway");
                // 继续执行，某些7-Zip版本可能不支持此方法或者目录已存在
            }
        }

        // 添加文件到新位置
        let add_args = vec![
            "a".to_string(),                // Add command
            archive_path.clone(),           // Archive path
            format!("-w{}", temp_dir.to_string_lossy()), // Working directory
            format!("-ir!{}", file_name),   // Only include this file
            format!("-si{}", new_path),     // Set name inside archive
            "-y".to_string(),               // Auto-yes to all queries
        ];

        let output = run_7z_command(&seven_zip_path, &add_args)?;
        if !output.status.success() {
            let stderr_output = decode_7z_output(&output.stderr);
            let error_msg = format!(
                "Failed to add file to new location. Exit code: {}. Error: {}",
                output.status.code().unwrap_or(-1), stderr_output.trim()
            );
            crate::log_error!("{}", error_msg);
            return Err(error_msg);
        }

        // 步骤3：从原始压缩包中删除旧文件
        let delete_args = vec![
            "d".to_string(),            // Delete command
            archive_path.clone(),       // Archive path
            file_path.clone(),          // File to delete
            "-y".to_string(),           // Auto-yes to all queries
        ];

        let output = run_7z_command(&seven_zip_path, &delete_args)?;
        if !output.status.success() {
            let stderr_output = decode_7z_output(&output.stderr);
            crate::log_error!(
                "Warning: Failed to delete original file after moving. Exit code: {}. Error: {}",
                output.status.code().unwrap_or(-1), stderr_output.trim()
            );
            // 继续执行其他文件
        }
    }

    // 清理临时目录
    if let Err(e) = std::fs::remove_dir_all(&temp_dir) {
        crate::log_error!("Warning: Failed to clean up temp directory: {}", e);
        // 继续执行，不影响主要功能
    }

    crate::log_info!("Successfully moved files in archive: {}", archive_path);
    Ok(())
}

/// Pastes files that were previously cut or copied within an archive.
/// 粘贴先前在压缩包内剪切或复制的文件。
///
/// # Arguments
///
/// * `app_handle`   - The Tauri application handle (injected automatically).
///                  - Tauri 应用程序句柄（自动注入）。
/// * `archive_path` - The path to the archive file.
///                  - 压缩包文件的路径。
/// * `files`        - A vector of file/folder paths within the archive to paste.
///                  - 要粘贴的压缩包内文件/文件夹路径的向量。
/// * `destination`  - The destination directory path within the archive.
///                  - 压缩包内的目标目录路径。
/// * `is_cut`       - Whether the files were cut (true) or copied (false).
///                  - 文件是剪切（true）还是复制（false）。
///
/// # Returns
///
/// * `Ok(())` - If the paste operation was successful.
///            - 如果粘贴操作成功。
/// * `Err(String)` - An error message if the operation fails.
///                 - 如果操作失败，则返回错误消息。
#[tauri::command]
pub fn paste_files_in_archive(
    app_handle: AppHandle,
    archive_path: String,
    files: Vec<String>,
    destination: String,
    is_cut: bool
) -> Result<(), String> {
    if files.is_empty() {
        return Ok(());
    }

    crate::log_info!(
        "{} and pasting {} files/folders to '{}' in archive: {}",
        if is_cut { "Cutting" } else { "Copying" },
        files.len(), destination, archive_path
    );

    // 剪切操作与移动操作相同
    if is_cut {
        return move_files_in_archive(app_handle, archive_path, files, destination);
    }

    // 以下为复制操作
    // 创建临时目录用于解压和重新压缩
    let temp_dir = std::env::temp_dir().join("soarzip_copy_temp");
    if temp_dir.exists() {
        if let Err(e) = std::fs::remove_dir_all(&temp_dir) {
            let error_msg = format!("Failed to clean up existing temp directory: {}", e);
            crate::log_error!("{}", error_msg);
            return Err(error_msg);
        }
    }
    
    if let Err(e) = std::fs::create_dir_all(&temp_dir) {
        let error_msg = format!("Failed to create temp directory: {}", e);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // 解决7-Zip路径
    let seven_zip_path = resolve_7z_path(&app_handle)?;
    crate::log_info!("Using bundled 7-Zip at: {:?}", seven_zip_path);

    // 对每个文件执行提取-添加操作
    for file_path in &files {
        // 获取文件名（不包括路径）
        let file_name = file_path.split('/').last().unwrap_or(file_path);
        
        // 计算新路径
        let new_path = if destination.is_empty() {
            file_name.to_string()
        } else {
            format!("{}/{}", destination.trim_end_matches('/'), file_name)
        };
        
        // 跳过相同路径的文件
        if *file_path == new_path {
            continue;
        }

        // 步骤1：提取文件到临时目录
        let extract_args = vec![
            "e".to_string(),                // Extract command
            archive_path.clone(),           // Archive path
            file_path.clone(),              // File to extract
            format!("-o{}", temp_dir.to_string_lossy()), // Output directory
            "-y".to_string(),               // Auto-yes to all queries
        ];

        let output = run_7z_command(&seven_zip_path, &extract_args)?;
        if !output.status.success() {
            let stderr_output = decode_7z_output(&output.stderr);
            let error_msg = format!(
                "Failed to extract file '{}' for copying. Exit code: {}. Error: {}",
                file_path, output.status.code().unwrap_or(-1), stderr_output.trim()
            );
            crate::log_error!("{}", error_msg);
            return Err(error_msg);
        }

        // 步骤2：将文件以新路径添加回压缩包
        let temp_file_path = temp_dir.join(file_name);
        
        // 确保目标目录存在
        if !destination.is_empty() {
            // 创建中间目录结构
            let dir_args = vec![
                "a".to_string(),            // Add command
                archive_path.clone(),       // Archive path
                "-tzip".to_string(),        // Force ZIP format
                format!("-si{}", destination), // Set name inside archive
                "-y".to_string(),           // Auto-yes to all queries
            ];
            
            // 使用空输入流创建目录结构
            let mut child = std::process::Command::new(&seven_zip_path)
                .args(&dir_args)
                .stdin(std::process::Stdio::piped())
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped())
                .spawn()
                .map_err(|e| format!("Failed to spawn 7z process: {}", e))?;
                
            // 关闭子进程 stdin 管道以避免资源泄露
            child.stdin = None;
            
            let output = child.wait_with_output()
                .map_err(|e| format!("Failed to wait for 7z process: {}", e))?;
                
            if !output.status.success() {
                crate::log_warn!("Warning: Creating directory structure may have failed, but we'll continue anyway");
                // 继续执行，某些7-Zip版本可能不支持此方法或者目录已存在
            }
        }

        // 添加文件到新位置
        let add_args = vec![
            "a".to_string(),                // Add command
            archive_path.clone(),           // Archive path
            format!("-w{}", temp_dir.to_string_lossy()), // Working directory
            format!("-ir!{}", file_name),   // Only include this file
            format!("-si{}", new_path),     // Set name inside archive
            "-y".to_string(),               // Auto-yes to all queries
        ];

        let output = run_7z_command(&seven_zip_path, &add_args)?;
        if !output.status.success() {
            let stderr_output = decode_7z_output(&output.stderr);
            let error_msg = format!(
                "Failed to add file to new location. Exit code: {}. Error: {}",
                output.status.code().unwrap_or(-1), stderr_output.trim()
            );
            crate::log_error!("{}", error_msg);
            return Err(error_msg);
        }
    }

    // 清理临时目录
    if let Err(e) = std::fs::remove_dir_all(&temp_dir) {
        crate::log_error!("Warning: Failed to clean up temp directory: {}", e);
        // 继续执行，不影响主要功能
    }

    crate::log_info!("Successfully copied files in archive: {}", archive_path);
    Ok(())
}

/// Adds folders (and their contents) to an existing archive.
/// 将文件夹（及其内容）添加到现有压缩包。
///
/// # Arguments
///
/// * `app_handle`   - The Tauri application handle (injected automatically).
///                  - Tauri 应用程序句柄（自动注入）。
/// * `archive_path` - The path to the existing archive.
///                  - 现有压缩包的路径。
/// * `folder_paths` - A vector of folder paths to add to the archive.
///                  - 要添加到压缩包的文件夹路径向量。
///
/// # Returns
///
/// * `Ok(())` - If the folders were successfully added.
///            - 如果文件夹添加成功。
/// * `Err(String)` - An error message if the operation fails.
///                 - 如果操作失败，则返回错误消息。
#[tauri::command]
pub fn add_folders_to_archive(
    app_handle: AppHandle,
    archive_path: String,
    folder_paths: Vec<String>
) -> Result<(), String> {
    if folder_paths.is_empty() {
        return Ok(());
    }

    crate::log_info!(
        "Adding {} folders to archive: {}",
        folder_paths.len(), archive_path
    );

    // Check if archive exists
    if !Path::new(&archive_path).exists() {
        let error_msg = format!("Archive file not found: {}", archive_path);
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    // Resolve 7-Zip path
    let seven_zip_path = resolve_7z_path(&app_handle)?;
    crate::log_info!("Using bundled 7-Zip at: {:?}", seven_zip_path);

    // Build 7-Zip command arguments for adding folders
    // 7z a <archive_path> <folder1> <folder2> ... -y
    let mut args = vec![
        "a".to_string(),           // Add command
        archive_path.clone(),     // Archive path
        "-y".to_string(),         // Auto-yes to all queries
    ];

    // Add all folder paths to arguments
    for folder_path in folder_paths.iter() {
        // Ensure the path exists and is a directory
        let path = Path::new(folder_path);
        if !path.exists() {
            crate::log_warn!("Folder path does not exist, skipping: {}", folder_path);
            continue;
        }
        if !path.is_dir() {
            crate::log_warn!("Path is not a directory, skipping: {}", folder_path);
            continue;
        }
        args.push(folder_path.clone());
    }

    // Check if there are any valid folders to add
    if args.len() <= 3 { // Only base args 'a', archive_path, '-y'
        crate::log_warn!("No valid folders found to add after filtering.");
        return Ok(()); // Nothing to add
    }

    // Execute the 7-Zip command
    let output = run_7z_command(&seven_zip_path, &args)?;

    // Check if the command was successful
    if !output.status.success() {
        let stderr_output = decode_7z_output(&output.stderr);
        let error_msg = format!(
            "Failed to add folders to archive. Exit code: {}. Error: {}",
            output.status.code().unwrap_or(-1),
            stderr_output.trim()
        );
        crate::log_error!("{}", error_msg);
        return Err(error_msg);
    }

    crate::log_info!("Successfully added folders to archive: {}", archive_path);
    Ok(())
} 
//! Utilities for interacting with the bundled 7-Zip executable.
//! 与捆绑的 7-Zip 可执行文件交互的工具函数。

use std::process::{Command, Output, Stdio};
use std::path::{Path, PathBuf};
use std::collections::HashSet;
use tauri::{AppHandle, Manager};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
use encoding_rs;

// Changed import path
use crate::models::file_item::FileItem;

/// Determines the relative path to the bundled 7-Zip executable based on the target OS.
// ... (rest of the file content is the same as original archive_utils.rs)
// ... (including the restored cfg blocks from the previous step) ...
fn get_7z_resource_path() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    { Ok("binaries/win/7z.exe".to_string()) }
    #[cfg(target_os = "macos")]
    { Ok("binaries/macos/7z".to_string()) }
    #[cfg(target_os = "linux")]
    { Ok("binaries/linux/7z".to_string()) }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    { Err("Unsupported operating system for bundled 7-Zip.".to_string()) }
}

pub fn resolve_7z_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let resource_path_str = get_7z_resource_path()?;
    let resource_dir = app_handle.path().resource_dir()
        .map_err(|_| "Failed to get resource directory path".to_string())?;
    let seven_zip_path_buf = resource_dir.join(resource_path_str);

    if !seven_zip_path_buf.exists() {
        return Err(format!("Bundled 7-Zip executable not found at expected path: {:?}", seven_zip_path_buf));
    }
    Ok(seven_zip_path_buf)
}

pub fn run_7z_command(seven_zip_path: &Path, args: &[String]) -> Result<Output, String> {
    crate::log_info!("Executing 7-Zip command: {:?} {:?}", seven_zip_path, args);

    #[cfg(target_os = "windows")]
    let output_result = Command::new(seven_zip_path)
        .args(args)
        .creation_flags(0x08000000) // CREATE_NO_WINDOW
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output();

    #[cfg(not(target_os = "windows"))]
    let output_result = Command::new(seven_zip_path)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output();

    output_result.map_err(|e| {
        let error_msg = format!("Failed to execute bundled 7-Zip command: {}", e);
        crate::log_error!("{}", error_msg);
        error_msg
    })
}

pub fn decode_7z_output(output_bytes: &[u8]) -> String {
    #[cfg(target_os = "windows")]
    {
        let (decoded_cow, _encoding_used, had_errors) = encoding_rs::Encoding::for_label(b"GBK")
            .unwrap_or(encoding_rs::UTF_8)
            .decode(output_bytes);

        if had_errors {
            crate::log_error!("Error encountered while decoding 7-Zip output (used encoding: GBK/UTF-8). Output might be garbled.");
        }
        decoded_cow.into_owned()
    }
    #[cfg(not(target_os = "windows"))]
    {
        String::from_utf8_lossy(output_bytes).into_owned()
    }
}

pub fn parse_7z_list_output(output_str: &str) -> Vec<FileItem> {
    let mut files = Vec::new();
    let mut processed_paths = HashSet::new();

    crate::log_info!("Parsing 7-Zip list output.");
    if output_str.len() < 200 { 
        crate::log_info!("7-Zip output preview: {}...", output_str.chars().take(100).collect::<String>());
    } else {
        crate::log_info!("7-Zip output length: {}", output_str.len());
    }

    let mut current_item: Option<FileItem> = None;
    let mut path_str = String::new();
    let mut size: u64 = 0;
    let mut is_dir = false;
    let mut date = String::new();

    for line in output_str.lines() {
        let line = line.trim();

        if line.starts_with("Path = ") {
            if let Some(mut item) = current_item.take() {
                item.name = item.name.replace('\\', "/");
                if !processed_paths.contains(&item.name) {
                    processed_paths.insert(item.name.clone());
                    files.push(item);
                }
            }
            path_str = line.trim_start_matches("Path = ").to_string().replace('\\', "/");
            size = 0;
            is_dir = false;
            date = String::new();

        } else if line.starts_with("Size = ") {
            if let Ok(parsed_size) = line.trim_start_matches("Size = ").parse::<u64>() {
                size = parsed_size;
            }
        } else if line.starts_with("Folder = ") {
            is_dir = line.trim_start_matches("Folder = ") == "+";
            if is_dir && !path_str.ends_with('/') {
                path_str.push('/');
            }
        } else if line.starts_with("Modified = ") {
            date = line.trim_start_matches("Modified = ").to_string();
        } else if line.is_empty() && !path_str.is_empty() {
            let type_name = if is_dir {
                "文件夹".to_string()
            } else if let Some(ext) = Path::new(&path_str).extension().and_then(|os| os.to_str()) {
                 match ext.to_lowercase().as_str() {
                    "txt" => "文本文档".to_string(),
                    "jpg" | "jpeg" | "png" | "gif" | "bmp" => "图片".to_string(),
                    "pdf" => "PDF文档".to_string(),
                    "doc" | "docx" => "Word文档".to_string(),
                    "xls" | "xlsx" => "Excel表格".to_string(),
                    "ppt" | "pptx" => "PowerPoint演示文稿".to_string(),
                    "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" => "压缩文件".to_string(),
                    "exe" | "msi" => "可执行文件".to_string(),
                    "dll" => "应用扩展".to_string(),
                    "ini" | "cfg" | "conf" | "json" | "xml" | "yaml" | "toml" => "配置文件".to_string(),
                    "log" => "日志文件".to_string(),
                    "md" => "Markdown文件".to_string(),
                    "html" | "htm" => "HTML文档".to_string(),
                    "css" => "样式表".to_string(),
                    "js" | "ts" => "脚本文件".to_string(),
                    "py" => "Python脚本".to_string(),
                    "java" => "Java源文件".to_string(),
                    "c" | "cpp" | "h" => "C/C++源文件".to_string(),
                    "cs" => "C#源文件".to_string(),
                    "sh" => "Shell脚本".to_string(),
                    "bat" => "批处理脚本".to_string(),
                    "mp3" | "wav" | "ogg" | "flac" => "音频文件".to_string(),
                    "mp4" | "mkv" | "avi" | "mov" | "wmv" => "视频文件".to_string(),
                    "iso" => "镜像文件".to_string(),
                    _ => format!("{}文件", ext.to_uppercase()),
                }
            } else {
                "文件".to_string()
            };

            let file_item = FileItem {
                name: path_str.clone(),
                is_dir,
                size,
                modified_date: date.clone(),
                type_name,
            };

            current_item = Some(file_item);
            path_str = String::new();
        }
    }

    if let Some(mut item) = current_item.take() {
        item.name = item.name.replace('\\', "/");
        if !processed_paths.contains(&item.name) {
            processed_paths.insert(item.name.clone());
            files.push(item);
        }
    }

    let mut additional_dirs = Vec::new();
    let mut known_dir_paths: HashSet<String> = files.iter()
        .filter(|f| f.is_dir)
        .map(|f| f.name.clone())
        .chain(processed_paths.iter().filter(|p| p.ends_with('/')).cloned())
        .collect();

    for file in &files {
        if !file.is_dir { 
            let path_obj = Path::new(&file.name);
            let mut current_parent = path_obj.parent();
            while let Some(parent) = current_parent {
                if let Some(parent_str_os) = parent.to_str() {
                    let parent_str = parent_str_os.replace('\\', "/");
                    if !parent_str.is_empty() {
                        let dir_path = format!("{}/", parent_str);
                        if !known_dir_paths.contains(&dir_path) {
                            known_dir_paths.insert(dir_path.clone());
                            additional_dirs.push(FileItem {
                                name: dir_path,
                                is_dir: true,
                                size: 0,
                                modified_date: "".to_string(),
                                type_name: "Folder".to_string(),
                            });
                        }
                        current_parent = parent.parent();
                    } else {
                        break;
                    }
                } else {
                     break;
                }
            }
        }
    }

    files.extend(additional_dirs);

    files.retain(|file| {
        let name = &file.name;
        !name.is_empty() &&
        !name.contains("[MESSAGES]") &&
        !name.contains("Errors:") &&
        !name.contains("Warnings:") &&
        !name.starts_with("Scanning the drive for archives") &&
        !name.starts_with("7-Zip") &&
        !name.starts_with("Listing archive:") &&
        !name.starts_with("----------") &&
        !name.starts_with("Path = ") &&
        !name.starts_with("Size = ") &&
        !name.starts_with("Folder = ") &&
        !name.starts_with("Modified = ")
    });

    files.sort_by(|a, b| {
        match a.is_dir.cmp(&b.is_dir).reverse() {
            std::cmp::Ordering::Equal => a.name.cmp(&b.name),
            other => other,
        }
    });

    crate::log_info!("Successfully parsed {} file items.", files.len());

    files
} 
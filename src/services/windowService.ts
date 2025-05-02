/**
 * Window Service Module
 * 窗口服务模块
 * 
 * Provides functions for interacting with the application window (minimize, maximize, close, set title)
 * and utility functions for path manipulation (getting filename, directory, default extraction path).
 * 提供与应用程序窗口交互的功能（最小化、最大化、关闭、设置标题）
 * 以及用于路径操作的实用函数（获取文件名、目录、默认解压路径）。
 */
import { invoke } from "@tauri-apps/api/core";

/**
 * Minimizes the application window.
 * 最小化应用程序窗口。
 * 
 * Invokes the `minimize_window` command in the Rust backend.
 * 调用 Rust 后端的 `minimize_window` 命令。
 */
export async function minimizeWindow(): Promise<void> {
  console.log("[windowService] Attempting to minimize window...");
  try {
    await invoke('minimize_window');
    console.log("[windowService] Minimize window invoked successfully.");
  } catch (error) {
    console.error('[windowService] 最小化窗口失败:', error);
  }
}

/**
 * Toggles the application window between maximized and restored states.
 * 在最大化和还原状态之间切换应用程序窗口。
 * 
 * Invokes the `maximize_window` command in the Rust backend.
 * 调用 Rust 后端的 `maximize_window` 命令。
 */
export async function maximizeWindow(): Promise<void> {
  console.log("[windowService] Attempting to maximize/restore window...");
  try {
    await invoke('maximize_window');
    console.log("[windowService] Maximize/restore window invoked successfully.");
  } catch (error) {
    console.error('[windowService] 最大化/还原窗口失败:', error);
  }
}

/**
 * Closes the application window.
 * 关闭应用程序窗口。
 * 
 * Invokes the `close_window` command in the Rust backend.
 * 调用 Rust 后端的 `close_window` 命令。
 */
export async function closeWindow(): Promise<void> {
  console.log("[windowService] Attempting to close window...");
  try {
    await invoke('close_window');
    // No log after successful close as the app might terminate
  } catch (error) {
    console.error('[windowService] 关闭窗口失败:', error);
  }
}

/**
 * Sets the title of the application window.
 * 设置应用程序窗口的标题。
 * 
 * Updates both the custom title bar element in the HTML and the actual OS window title via the backend.
 * 通过后端更新 HTML 中的自定义标题栏元素和实际的操作系统窗口标题。
 * 
 * @param title - The desired window title text. If empty or null, a default text might be used.
 *              - 期望的窗口标题文本。如果为空或 null，可能会使用默认文本。
 */
export async function setWindowTitle(title: string): Promise<void> {
  // 1. Update the custom title bar element
  const currentFileElement = document.getElementById('current-file');
  if (currentFileElement) {
    currentFileElement.textContent = title || '未打开文件'; // Use provided title or default
    console.log(`[windowService] Custom title bar element updated to: "${title}"`);
  } else {
    console.warn('[windowService] Custom title bar element #current-file not found.');
  }

  // 2. Update the actual OS window title via backend
  console.log(`[windowService] Invoking set_window_title with title: "${title}"`);
  try {
    await invoke('set_window_title', { title });
    console.log(`[windowService] Successfully invoked set_window_title for: "${title}"`);
  } catch (error) {
    console.error(`[windowService] Failed to invoke set_window_title for "${title}":`, error);
  }
}

/**
 * Extracts the filename (including extension) from a full file path.
 * 从完整文件路径中提取文件名（包括扩展名）。
 * 
 * Handles both forward slash (/) and backslash (\) separators.
 * 处理正斜杠 (/) 和反斜杠 (\) 分隔符。
 * 
 * @param filePath - The full file path (e.g., 'C:\Users\Me\archive.zip' or '/home/user/archive.zip').
 *                 - 完整文件路径（例如 'C:\Users\Me\archive.zip' 或 '/home/user/archive.zip'）。
 * @returns - The filename part (e.g., 'archive.zip'). Returns an empty string if the input is empty or null.
 *          - 文件名部分（例如 'archive.zip'）。如果输入为空或 null，则返回空字符串。
 */
export function getFileNameFromPath(filePath: string): string {
  if (!filePath) return '';
  // 替换所有反斜杠为正斜杠，然后按正斜杠分割
  const parts = filePath.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1];
}

/**
 * Extracts the directory path from a full file path.
 * 从完整文件路径中提取目录路径。
 * 
 * Handles both forward slash (/) and backslash (\) separators.
 * 处理正斜杠 (/) 和反斜杠 (\) 分隔符。
 * 
 * @param filePath - The full file path (e.g., 'C:\Users\Me\archive.zip' or '/home/user/archive.zip').
 *                 - 完整文件路径（例如 'C:\Users\Me\archive.zip' 或 '/home/user/archive.zip'）。
 * @returns - The directory path (e.g., 'C:/Users/Me' or '/home/user'). Returns an empty string if the path has no directory component.
 *          - 目录路径（例如 'C:/Users/Me' 或 '/home/user'）。如果路径没有目录组件，则返回空字符串。
 */
export function getDirectoryPath(filePath: string): string {
  if (!filePath) return '';
  const normalizedPath = filePath.replace(/\\/g, '/');
  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    return ''; // Or perhaps '.' if it's just a filename?
  }
  return normalizedPath.substring(0, lastSlashIndex);
}

/**
 * Extracts the filename from a full file path, excluding the file extension.
 * 从完整文件路径中提取文件名，不包括文件扩展名。
 * 
 * Handles cases with no extension or multiple dots in the filename.
 * 处理没有扩展名或文件名中包含多个点的情况。
 * 
 * @param filePath - The full file path (e.g., 'C:\Users\Me\archive.tar.gz').
 *                 - 完整文件路径（例如 'C:\Users\Me\archive.tar.gz'）。
 * @returns - The filename without the last extension (e.g., 'archive.tar'). Returns the full name if no extension is found.
 *          - 不带最后一个扩展名的文件名（例如 'archive.tar'）。如果未找到扩展名，则返回完整名称。
 */
export function getFileNameWithoutExtension(filePath: string): string {
  const fileName = getFileNameFromPath(filePath);
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return fileName; // No extension or hidden file like .myfile
  }
  return fileName.substring(0, lastDotIndex);
}

/**
 * Generates a default extraction path based on the archive path.
 * 根据压缩包路径生成默认解压路径。
 * 
 * Typically creates a folder with the same name as the archive (without extension) in the same directory.
 * 通常在同一目录下创建一个与压缩包同名（不带扩展名）的文件夹。
 * 
 * @param archivePath - The path to the archive file.
 *                    - 压缩包文件的路径。
 * @returns - A suggested default path for extracting the archive contents.
 *          - 建议的用于解压压缩包内容的默认路径。
 */
export function getDefaultExtractPath(archivePath: string): string {
  const dirPath = getDirectoryPath(archivePath);
  const baseName = getFileNameWithoutExtension(archivePath);
  // The path separator may differ on Windows and macOS/Linux
  // Here we use / uniformly, which Tauri and Rust can handle better
  // If an OS-specific separator is needed, the join in tauri/api/path can be used
  if (!dirPath) {
    return baseName; // If there is no directory path, directly return the base name
  }
  return `${dirPath}/${baseName}`;
} 
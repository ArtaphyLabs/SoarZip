/**
 * Archive Service Module
 * 压缩包服务模块
 * 
 * Handles high-level archive operations like opening via dialog or path,
 * and orchestrates UI updates and state management related to archives.
 * 处理高级压缩包操作，例如通过对话框或路径打开，
 * 并协调与压缩包相关的UI更新和状态管理。
 */

import {
  openArchive as invokeOpenArchive,
  selectArchiveFile as invokeSelectArchiveFile,
} from "./fileService";
import { setWindowTitle, getFileNameFromPath } from "./windowService";
import {
  refreshUI,
} from "../ui/uiManager";
import { updateToolbarButtonsState } from "../setup/toolbar";
import { showHomePage } from "../ui/uiManager";
import { showFileBrowser } from "../ui/fileExplorer";
import {
  setCurrentArchivePath,
  setCurrentFiles,
  resetAppState,
  setIsLoading,
} from "./appState";
import { navigationHistory } from "./navigationService";
import { showError, showSuccess } from "../ui/notification";
import { invoke } from "@tauri-apps/api/core";
import { showNewArchiveDialog } from "../ui/newArchiveDialog";

/**
 * Opens a file dialog for selecting an archive file and loads it upon selection.
 * 打开文件对话框以选择压缩包文件，并在选择后加载它。
 */
export async function openArchiveDialogAndLoad() {
  try {
    console.log("Opening archive dialog...");
    const selected = await invokeSelectArchiveFile();

    if (selected) {
      console.log(`Archive selected: ${selected}`);
      await loadArchive(selected);
    } else {
      console.log("Archive selection cancelled.");
    }
  } catch (error) {
    console.error('Failed to open file dialog:', error);
    showError(`打开文件对话框失败: ${error}`);
  }
}

/**
 * Loads an archive file and updates the application state and UI.
 * 加载压缩包文件并更新应用程序状态和UI。
 *
 * @param archivePath - Path to the archive file to be loaded.
 *                    - 要加载的压缩包文件路径。
 */
export async function loadArchive(archivePath: string) {
  try {
    setIsLoading(true);
    console.log(`Starting to open archive: ${archivePath}`);
    const files = await invokeOpenArchive(archivePath);
    console.log(`Successfully retrieved file list with ${files.length} items`);

    setCurrentArchivePath(archivePath);
    setCurrentFiles(files);

    navigationHistory.reset("");
    showFileBrowser();

    const archiveFileName = getFileNameFromPath(archivePath);
    console.log(`[archiveService] Attempting to set window title to: "${archiveFileName}"`);
    await setWindowTitle(archiveFileName);
    console.log(`[archiveService] setWindowTitle invoked for: "${archiveFileName}"`);

    console.log("Refreshing UI...");
    refreshUI();
    console.log("UI refresh complete");

    showSuccess(`成功打开压缩包: ${getFileNameFromPath(archivePath)}`);
    updateToolbarButtonsState(true);

  } catch (error) {
    console.error('Failed to open archive:', error);
    showError(`打开压缩包失败: ${error}`);
    resetAppState();
    showHomePage();
    updateToolbarButtonsState(false);
  } finally {
    setIsLoading(false);
  }
} 

/**
 * Supported archive types with their display names and extensions.
 * 支持的压缩包类型及其显示名称和扩展名。
 */
export const ARCHIVE_TYPES = [
  { name: 'ZIP 压缩包', value: 'zip', extension: 'zip' },
  { name: '7Z 压缩包', value: '7z', extension: '7z' },
  { name: 'TAR 归档', value: 'tar', extension: 'tar' }
];

/**
 * Opens a file dialog for selecting a path and name for a new archive file.
 * 打开文件对话框以选择新压缩包文件的路径和名称。
 * 
 * @param defaultName - Default filename suggestion.
 *                    - 默认文件名建议。
 * @param archiveType - Type of archive to create.
 *                    - 要创建的压缩包类型。
 * @returns - Promise resolving to the selected file path, or null if the dialog was cancelled.
 *          - Promise解析为所选文件的路径，如果对话框被取消则为null。
 */
export async function selectNewArchivePath(defaultName: string, archiveType: string): Promise<string | null> {
  try {
    return await invoke<string | null>('select_new_archive_path', { 
      defaultName, 
      archiveType 
    });
  } catch (error) {
    console.error('Failed to open new archive path dialog:', error);
    showError(`选择新压缩包路径失败: ${error}`);
    return null;
  }
}

/**
 * Creates a new empty archive file and opens it.
 * 创建一个新的空压缩包文件并打开它。
 * 
 * @param archiveType - Type of archive to create (e.g., 'zip', '7z').
 *                    - 要创建的压缩包类型（例如，'zip'，'7z'）。
 */
export async function createNewArchive(archiveType: string) {
  try {
    setIsLoading(true);
    
    // Default name for the new archive
    const defaultName = "新建压缩包";
    
    // Open dialog to let user select where to save the new archive
    const archivePath = await selectNewArchivePath(defaultName, archiveType);
    
    if (!archivePath) {
      console.log("New archive creation cancelled.");
      return;
    }
    
    console.log(`Creating new ${archiveType} archive at: ${archivePath}`);
    
    // Invoke the backend to create the empty archive
    const createdPath = await invoke<string>('create_new_archive', {
      archivePath,
      archiveType
    });
    
    console.log(`Successfully created new archive at: ${createdPath}`);
    showSuccess(`成功创建新压缩包: ${getFileNameFromPath(createdPath)}`);
    
    // 确保在加载前显示文件浏览器UI
    showFileBrowser();
    
    // Load the newly created archive
    console.log(`Attempting to load newly created archive: ${createdPath}`);
    await loadArchive(createdPath);
    
    // 再次确保UI正确显示（以防loadArchive内部未正确显示UI）
    showFileBrowser();
    refreshUI();
    updateToolbarButtonsState(true);
    
    console.log(`Finished loading newly created archive: ${createdPath}`);
    
  } catch (error) {
    console.error('Failed to create new archive:', error);
    showError(`创建新压缩包失败: ${error}`);
    resetAppState();
    showHomePage();
  } finally {
    setIsLoading(false);
  }
}

/**
 * Shows a dialog to select archive type and creates a new archive.
 * 显示一个对话框以选择压缩包类型并创建新的压缩包。
 */
export async function createNewArchiveDialog() {
  try {
    // Call the function to show the UI dialog
    showNewArchiveDialog();
  } catch (error) {
    console.error('Failed to handle new archive dialog:', error);
    showError(`创建新压缩包对话框失败: ${error}`);
  }
} 
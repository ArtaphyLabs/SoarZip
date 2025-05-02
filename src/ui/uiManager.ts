/**
 * UI Manager Module
 * UI 管理器模块
 * 
 * Coordinates UI updates across different components (File Explorer, Status Bar, Navigation).
 * Provides centralized functions for refreshing the UI, navigating folders, managing loading state,
 * handling search, and resetting the application view.
 * 协调不同组件（文件浏览器、状态栏、导航）之间的 UI 更新。
 * 提供用于刷新 UI、导航文件夹、管理加载状态、处理搜索和重置应用程序视图的集中式函数。
 */

/**
 * Refreshes the entire UI based on the current application state.
 * Updates the file list, path navigation, navigation buttons, and status bar.
 * 根据当前应用程序状态刷新整个 UI。
 * 更新文件列表、路径导航、导航按钮和状态栏。
 */

import { formatFileSize } from "../utils/index";
import {
  FileItem,
  filterFilesByFolder,
  sortFiles,
  getFileStats
} from "../services/fileService";
import {
  getFileNameFromPath
} from "../services/windowService";
import {
  navigationHistory,
  normalizeFolderPath,
  updateNavButtonsState,
} from "../services/navigationService";
import {
  updateFileList,
  updatePathNavigation,
  setLoading as setFileListLoading,
  showHomePage
} from "./fileExplorer";
import { showInfo, showError } from "./notification";
import {
  getCurrentArchivePath, 
  getCurrentFiles, 
  getIsLoading, 
  setIsLoading as setAppStateLoading,
  resetAppState
} from "../services/appState";
import { setWindowTitle } from "../services/windowService"; // For logo click reset
import { updateToolbarButtonsState } from "../setup/toolbar"; // For logo click reset & status bar updates
export { showHomePage } from "./fileExplorer";


export function refreshUI() {
  const currentFolder = navigationHistory.getCurrentPath();
  const currentFiles = getCurrentFiles();
  const currentArchivePath = getCurrentArchivePath();
  console.log(`[uiManager] Refreshing UI, current folder: "${currentFolder}"`);

  const filteredFiles = filterFilesByFolder(currentFiles, currentFolder);
  const sortedFiles = sortFiles(filteredFiles);

  updateFileList(
    sortedFiles,
    currentFolder,
    undefined, // onFileClick
    (file: FileItem) => { // onFileDblClick
      if (getIsLoading()) return;
      if (file.is_dir) {
        navigateToFolder(file.name); // Use the manager's navigation function
      } else {
        console.log(`Attempted to preview file (not implemented): ${file.name}`);
        // Potentially call a file preview service here
      }
    }
  );

  updatePathNavigation(
    currentFolder,
    getFileNameFromPath(currentArchivePath),
    navigateToFolder // Use the manager's navigation function
  );

  updateNavButtonsState();
  updateStatusBar();
}

/**
 * Navigates to a specific folder within the archive and triggers a UI refresh.
 * 导航到压缩包内的特定文件夹并触发 UI 刷新。
 *
 * @param folderPath - The relative path of the folder to navigate to (e.g., 'folder/subfolder/').
 *                   - 要导航到的文件夹的相对路径（例如 'folder/subfolder/'）。
 */
export function navigateToFolder(folderPath: string) {
  console.log(`[uiManager] Navigating to folder: ${folderPath}`);
  if (getIsLoading()) return;

  const normalizedPath = normalizeFolderPath(folderPath);
  navigationHistory.addPath(normalizedPath);
  refreshUI();
}

/**
 * Updates the global loading state for the application and relevant UI elements.
 * Manages the visibility of loading indicators (e.g., spinner) and updates status text.
 * 更新应用程序和相关 UI 元素的全局加载状态。
 * 管理加载指示器（例如旋转图标）的可见性并更新状态文本。
 *
 * @param loading - Boolean indicating whether to enter (`true`) or exit (`false`) the loading state.
 *                - 指示是进入 (`true`) 还是退出 (`false`) 加载状态的布尔值。
 * @param message - Optional message to display in the status bar while loading.
 *                - 加载时在状态栏中显示的可选消息。
 */
export function updateLoadingStatus(loading: boolean, message: string = "") {
  setAppStateLoading(loading);
  setFileListLoading(loading); // Update file list UI loading state

  const statusTextElement = document.getElementById('status-text');
  const spinnerElement = document.getElementById('status-spinner');

  if (statusTextElement) {
    if (loading) {
      statusTextElement.textContent = message;
      document.body.classList.add('loading');
      if (spinnerElement) {
        spinnerElement.style.display = 'inline-block';
      }
    } else {
      document.body.classList.remove('loading');
      updateStatusBar(); // Restore default status bar text
      if (spinnerElement) {
        spinnerElement.style.display = 'none';
      }
    } 
  }
}

/**
 * Updates the content of the status bar based on the current application state.
 * Shows file/folder statistics if an archive is open, otherwise shows a welcome message.
 * 根据当前应用程序状态更新状态栏的内容。
 * 如果打开了压缩包，则显示文件/文件夹统计信息，否则显示欢迎消息。
 */
export function updateStatusBar() {
  // Prevent status bar update if loading
  if (getIsLoading()) return; 

  const statusTextElement = document.getElementById('status-text');
  const statusRight = document.querySelector('.status-right');

  if (!statusTextElement || !statusRight) return;

  const currentArchivePath = getCurrentArchivePath();
  if (!currentArchivePath) {
    statusTextElement.textContent = '欢迎使用 Soar Zip';
    statusRight.textContent = '版本: 0.1.0'; // TODO: Get version dynamically
    return;
  }

  const currentFolder = navigationHistory.getCurrentPath();
  const currentFiles = getCurrentFiles();
  const stats = getFileStats(currentFiles, currentFolder);

  statusTextElement.textContent = `${stats.count}个项目`;
  statusRight.textContent = `总大小: ${formatFileSize(stats.totalSize)}`;
}

/**
 * Performs a search within the currently displayed files based on a query string.
 * Updates the file list to show only matching results and updates the status bar.
 * 根据查询字符串在当前显示的文件内执行搜索。
 * 更新文件列表以仅显示匹配结果，并更新状态栏。
 *
 * @param query - The search term entered by the user.
 *              - 用户输入的搜索词。
 */
export function performSearch(query: string) {
  console.log(`[uiManager] Performing search for: "${query}"`);
  const currentArchivePath = getCurrentArchivePath();
  if (!currentArchivePath) {
    showError('请先打开一个压缩包');
    return;
  }

  if (getIsLoading()) return; // Don't search while loading

  const currentFolder = navigationHistory.getCurrentPath();
  const currentFiles = getCurrentFiles();
  const filesToSearch = filterFilesByFolder(currentFiles, currentFolder);

  const searchResults = filesToSearch.filter(file => {
    const displayName = getFileNameFromPath(file.name) || file.name;
    return displayName.toLowerCase().includes(query.toLowerCase());
  });

  console.log(`Search found ${searchResults.length} results.`);

  // Update file list directly with search results
  updateFileList(sortFiles(searchResults), currentFolder);

  // Update status bar to show search result count
  const statusTextElement = document.getElementById('status-text'); // Target correct element
  if (statusTextElement) {
    statusTextElement.textContent = `找到 ${searchResults.length} 个匹配项`;
  }

  if (searchResults.length === 0) {
    showInfo(`未找到匹配 "${query}" 的文件`);
  }
}

/**
 * Resets the application to its initial state: shows the home page, clears archive data,
 * resets window title, updates status bar, disables relevant toolbar buttons, and resets navigation history.
 * 将应用程序重置为其初始状态：显示主页，清除压缩包数据，
 * 重置窗口标题，更新状态栏，禁用相关的工具栏按钮，并重置导航历史。
 */
export function resetAppToHome() {
  resetAppState();
  showHomePage();
  setWindowTitle('未打开文件');
  updateStatusBar();
  updateToolbarButtonsState(false); // Disable buttons relevant to open archive
  navigationHistory.reset("");
} 
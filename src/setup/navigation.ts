import { openArchive } from "../services/fileService";
import { showError } from "../ui/notification";

/**
 * Interface defining the dependencies required by the navigation setup function.
 * 定义导航设置功能所需的依赖项的接口。
 */
export interface NavigationDependencies {
  /** Checks if the application is currently in a loading state. 用于检查应用程序当前是否处于加载状态。 */
  isLoading: () => boolean;
  /** Checks if navigation back is possible. 用于检查是否可以向后导航。 */
  canGoBack: () => boolean;
  /** Gets the previous path from history and updates the index. 用于从历史记录中获取上一个路径并更新索引。 */
  getPreviousPath: () => string | null;
  /** Checks if navigation forward is possible. 用于检查是否可以向前导航。 */
  canGoForward: () => boolean;
  /** Gets the next path from history and updates the index. 用于从历史记录中获取下一个路径并更新索引。 */
  getNextPath: () => string | null;
  /** Gets the current path from history. 用于从历史记录中获取当前路径。 */
  getCurrentPath: () => string;
  /** Calculates the parent path of a given path. 用于计算给定路径的父路径。 */
  getParentPath: (path: string) => string;
  /** Triggers a UI refresh based on the current navigation state. 用于根据当前导航状态触发 UI 刷新。 */
  refreshUI: () => void;
  /** Navigates the file view to a specific folder path. 用于将文件视图导航到特定的文件夹路径。 */
  navigateToFolder: (folderPath: string) => void;
  /** Gets the path of the currently loaded archive. 用于获取当前加载的压缩包的路径。 */
  getArchivePath: () => string;
  /** Updates the global loading status indicator. 用于更新全局加载状态指示器。 */
  updateLoadingStatus: (loading: boolean, message?: string) => void;
  /** Sets the cached list of files in the application state. 用于在应用程序状态中设置缓存的文件列表。 */
  setCurrentFiles: (files: any[]) => void; // Adjust FileItem type if needed / 如有需要，调整 FileItem 类型
}

/**
 * Sets up click event listeners for the main navigation buttons (Back, Forward, Up, Refresh).
 * 为主导航按钮（后退、前进、上一级、刷新）设置点击事件监听器。
 * 
 * Connects button clicks to the corresponding actions provided by the `NavigationDependencies`.
 * 将按钮点击连接到 `NavigationDependencies` 提供的相应操作。
 * 
 * @param deps - An object containing the required dependency functions and state getters.
 *             - 包含所需依赖函数和状态获取器的对象。
 */
export function setupNavButtons(deps: NavigationDependencies): void {
  const backBtn = document.querySelector('.nav-btn[title="Back"]');
  const forwardBtn = document.querySelector('.nav-btn[title="Forward"]');
  const upBtn = document.querySelector('.nav-btn[title="Up level"]');
  const refreshBtn = document.querySelector('.nav-btn[title="Refresh"]');
  
  // Back button click
  backBtn?.addEventListener('click', () => {
    if (deps.isLoading() || !deps.canGoBack()) return;
    
    const prevPath = deps.getPreviousPath();
    if (prevPath !== null) {
      // The history index is already updated by getPreviousPath
      deps.refreshUI(); 
    }
  });
  
  // Forward button click
  forwardBtn?.addEventListener('click', () => {
    if (deps.isLoading() || !deps.canGoForward()) return;
    
    const nextPath = deps.getNextPath();
    if (nextPath !== null) {
      // The history index is already updated by getNextPath
      deps.refreshUI();
    }
  });
  
  // Up button click
  upBtn?.addEventListener('click', () => {
    if (deps.isLoading()) return;
    
    const currentPath = deps.getCurrentPath();
    if (currentPath) {
      const parentPath = deps.getParentPath(currentPath);
      deps.navigateToFolder(parentPath);
    }
  });
  
  // Refresh button click
  refreshBtn?.addEventListener('click', async () => {
    const archivePath = deps.getArchivePath();
    if (deps.isLoading() || !archivePath) return;
    
    try {
      deps.updateLoadingStatus(true, "正在刷新...");
      
      // Reload the current archive
      const files = await openArchive(archivePath);
      deps.setCurrentFiles(files); // Update files in main.ts state
      
      // Refresh UI
      deps.refreshUI();
      
      // Remove refresh success message
      // showSuccess("刷新完成"); 
    } catch (error) {
      console.error('刷新失败:', error);
      showError(`刷新失败: ${error}`);
    } finally {
      deps.updateLoadingStatus(false);
    }
  });
} 
/**
 * Navigation Service Module
 * 导航服务模块
 * 
 * Manages the browsing history within an opened archive, allowing back/forward/up navigation.
 * Also provides path normalization utilities.
 * 管理打开的压缩包内的浏览历史记录，允许后退/前进/向上导航。
 * 还提供路径规范化实用程序。
 */

/**
 * Class that manages navigation history for browsing archive contents.
 * 管理压缩包内容浏览的导航历史的类。
 * 
 * Maintains a list of visited paths and the current position within that list.
 * 维护访问过的路径列表以及在该列表中的当前位置。
 */
class NavigationHistory {
  private history: string[] = [];
  private currentIndex: number = -1;

  /**
   * Adds a new path to the navigation history.
   * 添加新路径到导航历史记录。
   * 
   * If the current position is not at the end of the history (i.e., after going back),
   * the history after the current position is truncated before adding the new path.
   * 如果当前位置不在历史记录的末尾（即后退之后），
   * 则在添加新路径之前，当前位置之后的历史记录将被截断。
   * 
   * Does not add the path if it's identical to the current path.
   * 如果路径与当前路径相同，则不添加。
   * 
   * @param path - The path (typically a folder path within the archive) to add.
   *             - 要添加的路径（通常是压缩包内的文件夹路径）。
   */
  addPath(path: string): void {
    // If not at the end of history, truncate the future history
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }
    
    // Only add if the path is different from current
    if (this.history[this.currentIndex] !== path) {
      this.history.push(path);
      this.currentIndex = this.history.length - 1;
    }
  }

  /**
   * Moves the current position back one step in the history and returns the path at that position.
   * 将当前位置在历史记录中后退一步，并返回该位置的路径。
   * 
   * @returns - The previous path in the history, or null if already at the beginning.
   *          - 历史记录中的上一个路径，如果已在开头则返回 null。
   */
  getPreviousPath(): string | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Moves the current position forward one step in the history and returns the path at that position.
   * 将当前位置在历史记录中前进一步，并返回该位置的路径。
   * 
   * @returns - The next path in the history, or null if already at the end.
   *          - 历史记录中的下一个路径，如果已在末尾则返回 null。
   */
  getNextPath(): string | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Calculates the parent folder path for a given path within the archive.
   * 计算压缩包内给定路径的父文件夹路径。
   * 
   * @param currentPath - The path for which to find the parent (e.g., 'folder/subfolder/').
   *                    - 要查找父级的路径（例如 'folder/subfolder/'）。
   * @returns - The parent folder path (e.g., 'folder/'), or an empty string if the input path is root or invalid.
   *          - 父文件夹路径（例如 'folder/'），如果输入路径是根目录或无效，则返回空字符串。
   */
  getParentPath(currentPath: string): string {
    if (!currentPath) return "";
    
    // Remove trailing slash if present
    const normalizedPath = currentPath.endsWith('/') 
      ? currentPath.slice(0, -1) 
      : currentPath;
    
    // Find position of last slash
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    
    // If no slash found, return empty string (root directory)
    if (lastSlashIndex < 0) return "";
    
    // If slash is at beginning, return root
    if (lastSlashIndex === 0) return "/";
    
    // Return portion up to the last slash
    return normalizedPath.substring(0, lastSlashIndex) + '/';
  }

  /**
   * Resets the navigation history, clearing all entries except for an optional initial path.
   * 重置导航历史记录，清除除可选初始路径之外的所有条目。
   * 
   * @param initialPath - The path to set as the first entry in the new history. Defaults to an empty string (root).
   *                    - 设置为新历史记录中第一个条目的路径。默认为空字符串（根目录）。
   */
  reset(initialPath: string = ""): void {
    this.history = [initialPath];
    this.currentIndex = 0;
  }

  /**
   * Checks if it's possible to navigate back in the history.
   * 检查是否可以在历史记录中后退。
   * 
   * @returns - True if the current position is not at the beginning of the history, false otherwise.
   *          - 如果当前位置不在历史记录的开头，则返回 true，否则返回 false。
   */
  canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Checks if it's possible to navigate forward in the history.
   * 检查是否可以在历史记录中前进。
   * 
   * @returns - True if the current position is not at the end of the history, false otherwise.
   *          - 如果当前位置不在历史记录的末尾，则返回 true，否则返回 false。
   */
  canGoForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Gets the path at the current position in the navigation history.
   * 从导航历史记录中获取当前位置的路径。
   * 
   * @returns - The current path, or an empty string if the history is empty or invalid.
   *          - 当前路径，如果历史记录为空或无效，则返回空字符串。
   */
  getCurrentPath(): string {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return "";
  }
}

// Export the singleton instance
export const navigationHistory = new NavigationHistory();

/**
 * Normalizes a folder path string for consistent representation within the application.
 * 标准化文件夹路径字符串，以便在应用程序内保持一致的表示。
 * 
 * - Ensures non-empty paths end with a slash (`/`).
 * - Removes leading slashes.
 * - Returns an empty string for null, undefined, or empty input.
 * - 确保非空路径以斜杠 (`/`) 结尾。
 * - 移除开头的斜杠。
 * - 对于 null、undefined 或空输入，返回空字符串。
 * 
 * @param folderPath - The folder path string to normalize.
 *                   - 要标准化的文件夹路径字符串。
 * @returns - The normalized folder path string (e.g., 'folder/subfolder/' or '').
 *          - 标准化后的文件夹路径字符串（例如 'folder/subfolder/' 或 ''）。
 */
export function normalizeFolderPath(folderPath: string): string {
  // Ensure empty path returns empty string (root directory)
  if (!folderPath) return '';
  
  // Remove extra leading slashes
  let normalizedPath = folderPath.replace(/^\/+/, '');
  
  // Ensure non-empty paths end with slash
  if (normalizedPath && !normalizedPath.endsWith('/')) {
    normalizedPath += '/';
  }
  
  return normalizedPath;
}

/**
 * Updates the enabled/disabled state of the navigation control buttons (Back, Forward, Up) in the UI.
 * 更新 UI 中导航控制按钮（后退、前进、上一级）的启用/禁用状态。
 * 
 * Queries the DOM for the buttons and sets the `disabled` class based on the current state of the `navigationHistory`.
 * 查询 DOM 中的按钮，并根据 `navigationHistory` 的当前状态设置 `disabled` 类。
 */
export function updateNavButtonsState(): void {
  const backBtn = document.querySelector('.nav-btn[title="后退"]');
  const forwardBtn = document.querySelector('.nav-btn[title="前进"]');
  const upBtn = document.querySelector('.nav-btn[title="上一级"]');
  
  // Remove all disabled states initially
  document.querySelectorAll('.nav-btn').forEach(btn => {
    (btn as HTMLElement).classList.remove('disabled');
  });
  
  // Update back button state
  if (backBtn) {
    if (navigationHistory.canGoBack()) {
      backBtn.classList.remove('disabled');
    } else {
      backBtn.classList.add('disabled');
    }
  }
  
  // Update forward button state
  if (forwardBtn) {
    if (navigationHistory.canGoForward()) {
      forwardBtn.classList.remove('disabled');
    } else {
      forwardBtn.classList.add('disabled');
    }
  }
  
  // Update up button state
  if (upBtn) {
    const currentPath = navigationHistory.getCurrentPath();
    if (currentPath) {
      upBtn.classList.remove('disabled');
    } else {
      upBtn.classList.add('disabled');
    }
  }
} 
/**
 * Theme Service Module
 * 主题服务模块
 * 
 * Manages the application's visual theme (light, dark, system).
 * Handles loading/saving theme preferences and applying theme changes to the UI.
 * 管理应用程序的视觉主题（浅色、深色、系统）。
 * 处理加载/保存主题偏好以及将主题更改应用于 UI。
 */

/**
 * Theme mode type definition, allowing light, dark, or system-based theme.
 * 主题模式类型定义，允许浅色、深色或基于系统的主题。
 */
export type ThemeMode = 'light' | 'dark' | 'system';

// Local storage key for theme settings
const THEME_STORAGE_KEY = 'soar-zip-theme-mode';

/**
 * Gets the current system theme preference
 * 获取当前系统主题偏好
 * 
 * Uses the `prefers-color-scheme` media query.
 * 使用 `prefers-color-scheme` 媒体查询。
 * 
 * @returns - 'dark' if the system prefers a dark scheme, otherwise 'light'.
 *          - 如果系统偏好深色方案则返回 'dark'，否则返回 'light'。
 */
function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Loads the user's previously saved theme preference from local storage.
 * 从本地存储加载用户先前保存的主题偏好。
 * 
 * @returns - The saved `ThemeMode` ('light', 'dark', 'system'), or 'system' if no preference is found.
 *          - 保存的 `ThemeMode`（'light', 'dark', 'system'），如果未找到偏好则返回 'system'。
 */
export function loadSavedTheme(): ThemeMode {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return (savedTheme as ThemeMode) || 'system';
}

/**
 * Saves the user's selected theme preference to local storage.
 * 将用户选择的主题偏好保存到本地存储。
 * 
 * @param mode - The `ThemeMode` ('light', 'dark', 'system') to save.
 *             - 要保存的 `ThemeMode`（'light', 'dark', 'system'）。
 */
export function saveThemeMode(mode: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}

/**
 * Applies the selected theme mode to the application's UI.
 * 将选定的主题模式应用于应用程序的 UI。
 * 
 * Resolves 'system' mode to the actual system preference ('light' or 'dark'),
 * updates the document's class list (`theme-light`/`theme-dark`),
 * updates the theme-color meta tag, and saves the preference if it changed.
 * 将 'system' 模式解析为实际的系统偏好（'light' 或 'dark'），
 * 更新文档的类列表（`theme-light`/`theme-dark`），
 * 更新 theme-color 元标签，并在偏好发生变化时保存。
 * 
 * @param mode - The `ThemeMode` to apply.
 *             - 要应用的 `ThemeMode`。
 */
export function applyTheme(mode: ThemeMode): void {
  const actualTheme = mode === 'system' ? getSystemTheme() : mode;
  
  console.log(`[themeService] Applying theme: ${mode} (actual: ${actualTheme})`);
  
  // Remove previous theme classes
  document.documentElement.classList.remove('theme-light', 'theme-dark');
  
  // Add new theme class
  document.documentElement.classList.add(`theme-${actualTheme}`);
  
  // Update meta tag for system theme integration
  updateThemeMetaTag(actualTheme);
  
  // Save setting if changed
  if (mode !== loadSavedTheme()) {
    saveThemeMode(mode);
  }
  
  // Dispatch event for component reactions
  dispatchThemeChangeEvent(actualTheme);
}

/**
 * Updates the `theme-color` meta tag in the document's head.
 * 更新文档 head 中的 `theme-color` 元标签。
 * 
 * This influences the color of the browser/OS UI surrounding the web content (if supported).
 * 这会影响围绕 Web 内容的浏览器/操作系统 UI 的颜色（如果支持）。
 * 
 * @param theme - The actual theme being applied ('light' or 'dark').
 *              - 正在应用的实际主题（'light' 或 'dark'）。
 */
function updateThemeMetaTag(theme: 'light' | 'dark'): void {
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  
  // Set theme color value based on light/dark mode
  const color = theme === 'dark' ? '#1e1e1e' : '#f9f9f9';
  metaThemeColor.setAttribute('content', color);
}

/**
 * Dispatches a custom 'themechange' event on the document element.
 * 在 document 元素上分发一个自定义的 'themechange' 事件。
 * 
 * Allows other parts of the application to react to theme changes.
 * 允许应用程序的其他部分对主题更改做出反应。
 * 
 * @param theme - The actual theme that was applied ('light' or 'dark').
 *              - 已应用的实际主题（'light' 或 'dark'）。
 */
function dispatchThemeChangeEvent(theme: 'light' | 'dark'): void {
  const event = new CustomEvent('themechange', { 
    detail: { theme },
    bubbles: true 
  });
  document.documentElement.dispatchEvent(event);
}

/**
 * Initializes the theme system when the application starts.
 * 在应用程序启动时初始化主题系统。
 * 
 * Loads the saved theme preference, applies it, and sets up a listener
 * to automatically update the theme if the system's color scheme changes
 * and the current mode is 'system'.
 * 加载保存的主题偏好，应用它，并设置一个监听器
 * 以在系统配色方案更改且当前模式为 'system' 时自动更新主题。
 */
export function initializeTheme(): void {
  console.log("[themeService] Initializing theme...");
  const savedTheme = loadSavedTheme();
  applyTheme(savedTheme);
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentTheme = loadSavedTheme();
    console.log(`[themeService] System theme changed: ${e.matches ? 'dark' : 'light'}`);
    
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  });
} 
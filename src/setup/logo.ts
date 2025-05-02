/**
 * Logo Setup Module
 * Logo 设置模块
 * 
 * Configures the click behavior of the application logo,
 * including setting the image source and handling confirmation
 * before returning to the home screen if an archive is open.
 * 配置应用程序 Logo 的点击行为，
 * 包括设置图像源以及在打开压缩包的情况下
 * 返回主屏幕前处理确认操作。
 */
// Import the logo image asset
import logoSrc from '../../src-tauri/icons/icon.png'; 
import { showConfirmDialog } from '../ui/confirmDialog';

/**
 * Interface defining the dependencies required by the logo click setup function.
 * 定义 Logo 点击设置功能所需的依赖项的接口。
 */
export interface LogoClickDependencies {
  /**
   * Function to get the path of the currently loaded archive.
   * 获取当前加载的压缩包路径的函数。
   */
  getArchivePath: () => string;
  /**
   * Function to reset the application state and return to the home page.
   * 重置应用程序状态并返回主页的函数。
   */
  resetApp: () => void;
}

/**
 * Sets up the click event listener for the application logo.
 * 设置应用程序 Logo 的点击事件监听器。
 * 
 * - Sets the logo image source.
 * - Adds a click listener that:
 *   - If an archive is open, shows a confirmation dialog before resetting the app.
 *   - If no archive is open, does nothing.
 * - 设置 Logo 图片源。
 * - 添加点击监听器，该监听器：
 *   - 如果已打开压缩包，则在重置应用程序之前显示确认对话框。
 *   - 如果未打开压缩包，则不执行任何操作。
 * 
 * @param deps - An object containing the required dependency functions (`getArchivePath`, `resetApp`).
 *             - 包含所需依赖函数 (`getArchivePath`, `resetApp`) 的对象。
 */
export function setupLogoClick(deps: LogoClickDependencies): void {
  const logoElement = document.querySelector('.logo');
  const logoImg = logoElement?.querySelector('img'); // Find the img tag within the logo element

  // Set the image source dynamically
  if (logoImg instanceof HTMLImageElement) {
    logoImg.src = logoSrc;
  } else if (logoElement) {
    // Log an error if the img tag isn't found inside .logo
    console.error('Could not find the <img> tag within the .logo element.');
  }

  // Attach the click event listener
  logoElement?.addEventListener('click', () => {
    if (deps.getArchivePath()) {
      // If an archive is open, ask for confirmation using the custom dialog
      showConfirmDialog(
        '确认返回主页吗？当前压缩包的浏览进度将丢失。', 
        () => {
          // On confirm, call resetApp
          deps.resetApp();
        },
        // On cancel, do nothing (optional cancel callback)
        () => {
          console.log('Return to home cancelled by user.');
        }
      );
    }
    // If no archive is open, clicking the logo does nothing.
  });
}

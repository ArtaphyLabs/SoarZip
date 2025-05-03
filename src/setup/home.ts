/**
 * Home Page Setup Module
 * 主页设置模块
 * 
 * Configures event listeners for interactive elements on the initial home screen,
 * such as the 'Open Archive' and 'New Archive' buttons.
 * 为初始主屏幕上的交互元素配置事件监听器，
 * 例如"打开压缩包"和"新建压缩包"按钮。
 */
import { showNewArchiveDialog } from '../ui/newArchiveDialog';

/**
 * Interface defining the dependencies required by the home page setup function.
 * 定义主页设置功能所需的依赖项的接口。
 */
export interface HomeActionDependencies {
  /**
   * Function to trigger the archive opening dialog.
   * 触发打开压缩包对话框的功能。
   */
  openArchiveDialog: () => Promise<void>;
}

/**
 * Sets up event listeners for the action buttons on the application's home page.
 * 为应用程序主页上的操作按钮设置事件监听器。
 * 
 * @param deps - An object containing the required dependency functions (e.g., `openArchiveDialog`).
 *             - 包含所需依赖函数（例如 `openArchiveDialog`）的对象。
 */
export function setupHomeActions(deps: HomeActionDependencies): void {
  console.log("Setting up home actions..."); // Log setup start
  const openArchiveBtn = document.getElementById('open-archive-btn');
  const newArchiveBtn = document.getElementById('new-archive-btn');
  
  if (!openArchiveBtn) {
    console.error("Open archive button not found!");
  }
  if (!newArchiveBtn) {
    console.error("New archive button not found!");
  }
  
  openArchiveBtn?.addEventListener('click', () => {
    console.log("Open archive button clicked"); // Log click
    deps.openArchiveDialog();
  });
  
  newArchiveBtn?.addEventListener('click', () => {
    console.log("New archive button clicked"); // Log click
    showNewArchiveDialog();
  });
  console.log("Home actions setup complete."); // Log setup end
} 
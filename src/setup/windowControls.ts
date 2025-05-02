/**
 * Window Controls Setup Module
 * 窗口控件设置模块
 * 
 * Configures the event listeners for the custom window control buttons
 * (Minimize, Maximize/Restore, Close) located in the title bar.
 * 为位于标题栏中的自定义窗口控制按钮
 * （最小化、最大化/还原、关闭）配置事件监听器。
 */
import { minimizeWindow, maximizeWindow, closeWindow } from '../services/windowService';

/**
 * Sets up click event listeners for the custom window control buttons (Minimize, Maximize/Restore, Close).
 * 为自定义窗口控制按钮（最小化、最大化/还原、关闭）设置点击事件监听器。
 * 
 * Connects each button to its corresponding function in the `windowService`.
 * 将每个按钮连接到 `windowService` 中的相应函数。
 */
export function setupWindowControls(): void {
  console.log("Setting up window controls..."); // Log setup start
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');

  if (!minimizeBtn || !maximizeBtn || !closeBtn) {
    console.error("Window control buttons not found!");
    return;
  }

  minimizeBtn.addEventListener('click', () => {
    console.log("Minimize button clicked"); // Log click
    minimizeWindow();
  });
  maximizeBtn.addEventListener('click', () => {
    console.log("Maximize button clicked"); // Log click
    maximizeWindow();
  });
  closeBtn.addEventListener('click', () => {
    console.log("Close button clicked"); // Log click
    closeWindow();
  });
  console.log("Window controls setup complete."); // Log setup end
} 
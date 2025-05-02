/**
 * Settings Button Setup Module
 * 设置按钮设置模块
 * 
 * Configures the event listener for the main settings button,
 * linking it to the function that displays the settings panel.
 * 配置主设置按钮的事件监听器，
 * 将其链接到显示设置面板的功能。
 */
import { showSettingsPanel } from '../ui/settingsPanel';

/**
 * Interface defining the dependencies required by the settings button setup function.
 * (Currently empty, but defined for future extension).
 * 定义设置按钮设置功能所需的依赖项的接口。
 * （当前为空，但为将来扩展而定义）。
 */
export interface SettingsDependencies {
  // No dependencies currently needed / 当前不需要任何依赖项
}

/**
 * Sets up the click event listener for the main settings button.
 * 设置主设置按钮的点击事件监听器。
 * 
 * When clicked, it calls the `showSettingsPanel` function to display the settings UI.
 * 点击时，它会调用 `showSettingsPanel` 函数来显示设置 UI。
 * 
 * @param _dependencies - An object containing dependencies (currently none needed).
 *                      - 包含依赖项的对象（当前不需要）。
 */
export function setupSettingsButton(_dependencies: SettingsDependencies): void {
  console.log("Setting up settings button...");
  const settingsBtn = document.getElementById('settings-btn');
  
  if (!settingsBtn) {
    console.error("Settings button not found!");
    return;
  }
  
  settingsBtn.addEventListener('click', () => {
    console.log("Settings button clicked"); 
    showSettingsPanel();
  });
  
  console.log("Settings button setup complete.");
} 
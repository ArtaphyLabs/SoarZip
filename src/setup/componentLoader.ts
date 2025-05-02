/**
 * Component Loader Module
 * 组件加载器模块
 * 
 * Responsible for dynamically loading HTML fragments for different UI components
 * into their designated placeholder elements in the main HTML structure.
 * 负责将不同 UI 组件的 HTML 片段动态加载到
 * 主 HTML 结构中指定的占位符元素内。
 */

// Import HTML content directly using Vite's ?raw suffix
import titlebarHtml from '../ui/components/titlebar.html?raw';
import toolbarHtml from '../ui/components/toolbar.html?raw';
import fileExplorerHtml from '../ui/components/file-explorer.html?raw';
import statusBarHtml from '../ui/components/status-bar.html?raw';
import extractDialogHtml from '../ui/components/extract-dialog.html?raw';
import confirmDialogHtml from '../ui/components/confirm-dialog.html?raw';
import { showError } from '../ui/notification';

/**
 * Inserts HTML content into a placeholder element.
 * 将 HTML 字符串内容插入到指定 ID 的占位符 DOM 元素中。
 * 
 * @param htmlContent - The raw HTML string to insert.
 *                    - 要插入的原始 HTML 字符串。
 * @param placeholderId - The `id` attribute of the target DOM element.
 *                      - 目标 DOM 元素的 `id` 属性。
 * @param componentName - A descriptive name of the component being loaded (for logging purposes).
 *                      - 正在加载的组件的描述性名称（用于日志记录）。
 */
function loadComponent(htmlContent: string, placeholderId: string, componentName: string) {
  try {
    const placeholder = document.getElementById(placeholderId);
    if (placeholder) {
      placeholder.innerHTML = htmlContent;
      console.log(`Successfully inserted component '${componentName}' into #${placeholderId}`);
    } else {
      console.error(`Placeholder element with ID '${placeholderId}' not found for component '${componentName}'.`);
      // Optionally show an error to the user if a critical component fails
      // showError(`无法加载界面组件: ${componentName}`);
    }
  } catch (error) {
    console.error(`Failed to insert component '${componentName}':`, error);
    // Optionally show an error to the user if a critical component fails
    showError(`无法加载界面组件: ${componentName}`); // Let's enable this
  }
}

/**
 * Loads all predefined UI component HTML fragments into the main document.
 * 将所有预定义的 UI 组件 HTML 片段加载到主文档中。
 * 
 * Iterates through a list of components and uses `loadComponent` to insert their HTML.
 * Also handles special cases like appending dialogs directly to the body.
 * 遍历组件列表并使用 `loadComponent` 插入它们的 HTML。
 * 同时处理特殊情况，例如将对话框直接附加到 body。
 */
export function loadAllComponents() {
  console.log("Inserting UI components...");
  loadComponent(titlebarHtml, 'titlebar-placeholder', 'titlebar.html');
  loadComponent(toolbarHtml, 'toolbar-placeholder', 'toolbar.html');
  loadComponent(fileExplorerHtml, 'file-explorer-placeholder', 'file-explorer.html');
  loadComponent(statusBarHtml, 'status-bar-placeholder', 'status-bar.html');
  loadComponent(extractDialogHtml, 'dialog-placeholder', 'extract-dialog.html');

  // Append the confirm dialog HTML to the body
  const confirmDialogContainer = document.createElement('div');
  confirmDialogContainer.innerHTML = confirmDialogHtml;
  // Append each top-level element from the confirm dialog HTML to the body
  // This prevents adding an extra wrapper div if confirmDialogHtml has a single root
  while (confirmDialogContainer.firstChild) {
    document.body.appendChild(confirmDialogContainer.firstChild);
  }

  console.log("All UI components inserted.");
} 
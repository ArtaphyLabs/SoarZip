/**
 * Menu Setup Module
 * 菜单设置模块
 * 
 * Configures the application's main menu bar, including dropdown behavior
 * and event handlers for menu item actions like Open, New, Exit, and About.
 * 配置应用程序的主菜单栏，包括下拉菜单行为
 * 以及菜单项操作（如打开、新建、退出和关于）的事件处理程序。
 */
import { showError } from '../ui/notification';
import { showAboutDialog } from '../ui/aboutDialog.ts';

/**
 * Interface defining the dependencies required by the menu setup function.
 * 定义菜单设置功能所需的依赖项的接口。
 */
export interface MenuDependencies {
  /**
   * Function to trigger the archive opening dialog.
   * 触发打开压缩包对话框的功能。
   */
  openArchiveDialog: () => Promise<void>;
}

/**
 * Sets up event listeners and behavior for the application's main menu and its dropdown items.
 * 为应用程序的主菜单及其下拉项设置事件监听器和行为。
 * 
 * - Handles toggling dropdown visibility when clicking main menu items.
 * - Handles executing actions when clicking dropdown items (e.g., Open, New, Exit, About).
 * - Handles closing dropdowns when clicking outside the menu area.
 * - 处理点击主菜单项时切换下拉菜单可见性的逻辑。
 * - 处理点击下拉菜单项时执行操作的逻辑（例如，打开、新建、退出、关于）。
 * - 处理点击菜单区域外部时关闭下拉菜单的逻辑。
 * 
 * @param deps - An object containing the required dependency functions (e.g., `openArchiveDialog`).
 *             - 包含所需依赖函数（例如 `openArchiveDialog`）的对象。
 */
export function setupMenuItems(deps: MenuDependencies): void {
  // Handle main menu button clicks - show/hide dropdown
  const menuContainers = document.querySelectorAll('.menu-container');
  const menuItems = document.querySelectorAll('.menu-item');
  
  menuItems.forEach(menuItem => {
    menuItem.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event bubbling
      
      // Close all other open menus
      menuContainers.forEach(container => {
        if (container !== menuItem.parentElement) {
          container.querySelector('.dropdown-menu')?.classList.remove('show');
        }
      });
      
      // Toggle the display state of the current menu
      const dropdown = menuItem.parentElement?.querySelector('.dropdown-menu');
      dropdown?.classList.toggle('show');
    });
  });
  
  // Handle dropdown item clicks
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  
  dropdownItems.forEach(item => {
    item.addEventListener('click', async (e) => {
      // Prevent bubbling to avoid triggering parent element events
      e.stopPropagation();
      
      const itemText = (item as HTMLElement).textContent;
      console.log(`Menu item ${itemText} clicked`);
      
      // Close the currently open dropdown menu
      const dropdown = item.closest('.dropdown-menu');
      dropdown?.classList.remove('show');
      
      // Handle specific menu items
      if (itemText === '打开') {
        await deps.openArchiveDialog(); // Use injected dependency
      } else if (itemText === '新建压缩') {
        // Logic for creating a new archive (implement later)
        showError('该功能正在开发中...'); // showError can be imported directly
      } else if (itemText === '退出') {
        window.close(); // Directly use window API
      } else if (itemText === '关于') {
        showAboutDialog(); // Show about dialog
      }
      // Add handling for other menu items (Save, Save As, View options, etc.) here
    });
  });
  
  // Close all dropdown menus when clicking elsewhere on the page
  document.addEventListener('click', () => {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  });
} 
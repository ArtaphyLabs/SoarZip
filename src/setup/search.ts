/**
 * Search Setup Module
 * 搜索设置模块
 * 
 * Configures the event listeners for the search input field and button
 * in the application toolbar, connecting them to the search functionality.
 * 为应用程序工具栏中的搜索输入字段和按钮配置事件监听器，
 * 将它们连接到搜索功能。
 */
export interface SearchDependencies {
  /**
   * Function to initiate a search operation with the given query.
   * 使用给定查询发起搜索操作的函数。
   */
  performSearch: (query: string) => void;
}

/**
 * Sets up event listeners for the search input field and search button.
 * 为搜索输入框和搜索按钮设置事件监听器。
 * 
 * - Triggers search when the search button is clicked.
 * - Triggers search when the Enter key is pressed in the input field.
 * - 单击搜索按钮时触发搜索。
 * - 在输入字段中按下 Enter 键时触发搜索。
 * 
 * @param deps - An object containing the required `performSearch` function.
 *             - 包含所需 `performSearch` 函数的对象。
 */
export function setupSearch(deps: SearchDependencies): void {
  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');
  
  // Search button click
  searchBtn?.addEventListener('click', () => {
    const searchText = (searchInput as HTMLInputElement)?.value;
    if (searchText) {
      deps.performSearch(searchText);
    }
  });
  
  // Trigger search on Enter key press
  searchInput?.addEventListener('keypress', (e: Event) => {
    // Check if the event is a KeyboardEvent before accessing 'key'
    if (e instanceof KeyboardEvent && e.key === 'Enter') {
      const searchText = (searchInput as HTMLInputElement)?.value;
      if (searchText) {
        deps.performSearch(searchText);
      }
    }
  });
} 
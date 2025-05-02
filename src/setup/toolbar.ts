/**
 * Toolbar Setup Module
 * 工具栏设置模块
 * 
 * Configures event listeners and state management for the buttons
 * in the application's main toolbar (e.g., Add, Extract, Delete).
 * 为应用程序主工具栏中的按钮（例如，添加、提取、删除）
 * 配置事件监听器和状态管理。
 */
import { showError, showInfo } from '../ui/notification';
import { getSelectedFiles } from '../ui/fileExplorer';

/**
 * Interface defining the dependencies required by the toolbar setup function.
 * 定义工具栏设置功能所需的依赖项的接口。
 */
export interface ToolbarDependencies {
  /** Function to get the path of the currently loaded archive. 获取当前加载的压缩包路径的函数。 */
  getArchivePath: () => string;
  /** Function to trigger the archive opening dialog. 触发打开压缩包对话框的函数。 */
  openArchiveDialog: () => Promise<void>;
  /** Function to initiate the file extraction process. 启动文件提取过程的函数。 */
  startExtraction: (filesToExtractOverride?: string[]) => Promise<void>; // Allow optional override
}

/**
 * Sets up event listeners for all buttons within the application toolbar.
 * 为应用程序工具栏内的所有按钮设置事件监听器。
 * 
 * Handles both specific button actions (like 'Extract') and generic actions based on button titles.
 * 处理特定的按钮操作（如"提取"）和基于按钮标题的通用操作。
 * 
 * @param deps - An object containing the required dependency functions.
 *             - 包含所需依赖函数的对象。
 */
export function setupToolbarButtons(deps: ToolbarDependencies): void {
  const toolButtons = document.querySelectorAll('.tool-btn');
  
  // Setup specific buttons first (Extract)
  const extractButton = document.getElementById('extract-button');

  if (extractButton) {
    extractButton.addEventListener('click', () => {
      console.log("工具按钮 提取文件 被点击 (特定ID)");
      const archivePath = deps.getArchivePath();
      if (!archivePath) {
        console.warn("解压按钮点击：没有打开的压缩包");
        showError('请先打开一个压缩包再进行解压。');
        return;
      }
      deps.startExtraction();
    });
  } else {
    console.warn("Toolbar button with ID 'extract-button' not found.");
  }

  // Setup generic handlers for other tool buttons
  toolButtons.forEach(button => {
    // Skip buttons that have specific handlers above
    if (button.id === 'extract-button') {
      return; 
    }

    button.addEventListener('click', () => {
      const title = button.getAttribute('title');
      console.log(`工具按钮 ${title} 被点击 (通用处理)`);
      
      const archivePath = deps.getArchivePath();
      if (!archivePath) {
        showError('请先打开一个压缩包');
        return;
      }
      
      // Handle different button actions
      switch(title) {
        case '添加文件':
          if (!archivePath) {
            deps.openArchiveDialog();
          } else {
            // Logic to add files (implement later)
            showError('该功能正在开发中...');
          }
          break;
        case '剪切':
        case '复制':
        case '粘贴':
        case '重命名':
        case '移动':
          showError('该功能正在开发中...');
          break;
        case '删除':
          handleDelete(deps);
          break;
        case '新建文件夹':
        case '属性':
          showError('该功能正在开发中...');
          break;
        default:
          console.warn(`Unhandled tool button: ${title}`);
      }
    });
  });

  // Initial state update (disable extract button)
  updateToolbarButtonsState(false);
}

/**
 * Handles the action when the 'Delete' toolbar button is clicked.
 * 处理单击"删除"工具栏按钮时的操作。
 * 
 * Gets the selected files and currently shows an informational message as the backend is not implemented.
 * 获取所选文件，并当前显示信息性消息，因为后端尚未实现。
 * 
 * @param _deps - Toolbar dependencies (passed but currently unused in this specific handler).
 *              - 工具栏依赖项（已传递但当前在此特定处理程序中未使用）。
 */
function handleDelete(_deps: ToolbarDependencies): void {
  const filesToDelete = getSelectedFiles();
  if (filesToDelete.length === 0) {
    showInfo("请先选择要删除的文件或文件夹。");
    return;
  }

  console.log("Attempting to delete files (not implemented):", filesToDelete);
  // TODO: Implement actual deletion logic by calling a backend function.
  // Example: await invoke('delete_files_in_archive', { archivePath: deps.getArchivePath(), files: filesToDelete });
  // Then refresh the UI: refreshUI(); (need to import refreshUI from main)

  showInfo(`删除功能正在开发中。选中的 ${filesToDelete.length} 个项目未被删除。`);
}

/**
 * Updates the enabled/disabled state of toolbar buttons based on whether an archive is loaded.
 * 根据是否加载了压缩包来更新工具栏按钮的启用/禁用状态。
 * 
 * Specifically targets buttons like 'Extract' that require an open archive.
 * 特别是针对像"提取"这样需要打开压缩包的按钮。
 * 
 * @param archiveLoaded - Boolean indicating if an archive is currently loaded.
 *                      - 布尔值，指示当前是否已加载压缩包。
 */
export function updateToolbarButtonsState(archiveLoaded: boolean) {
  const extractButton = document.getElementById('extract-button') as HTMLButtonElement | null;

  if (extractButton) {
    if (archiveLoaded) {
      extractButton.removeAttribute('disabled');
    } else {
      extractButton.setAttribute('disabled', 'true');
    }
  }
} 
/**
 * Toolbar Setup Module
 * 工具栏设置模块
 * 
 * Configures event listeners and state management for the buttons
 * in the application's main toolbar (e.g., Add, Extract, Delete).
 * 为应用程序主工具栏中的按钮（例如，添加、提取、删除）
 * 配置事件监听器和状态管理。
 */
import { showError, showInfo, showSuccess } from '../ui/notification';
import { getSelectedFiles } from '../ui/fileExplorer';
import { invoke } from '@tauri-apps/api/core';
import { showConfirmDialog } from '../ui/confirmDialog';
import { getCurrentArchivePath, getCurrentFiles, setCurrentFiles, setIsLoading } from '../services/appState';
import { refreshUI } from '../ui/uiManager';
import { createNewArchiveDialog } from '../services/archiveService';
import { FileItem } from '../services/fileService';
import { showInputDialog } from '../ui/inputDialog';
import { navigationHistory } from '../services/navigationService';

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
        case 'Add Files':
        case '添加文件':
        case '添加':
          handleAddFiles(deps);
          break;
        case 'Cut':
        case '剪切':
          handleCut();
          break;
        case 'Copy':
        case '复制':
          handleCopy();
          break;
        case 'Paste':
        case '粘贴':
          handlePaste();
          break;
        case 'Rename':
        case '重命名':
          handleRename();
          break;
        case 'Delete':
        case '删除':
          handleDelete();
          break;
        case 'New Folder':
        case '新建文件夹':
          handleNewFolder();
          break;
        case 'Properties':
        case '属性':
          handleProperties();
          break;
        case 'Add Folder':
        case '添加文件夹':
          handleAddFolder(deps);
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
 * Handles the action when the 'Add Files' toolbar button is clicked.
 * 处理单击"添加文件"工具栏按钮时的操作。
 * 
 * @param deps - Toolbar dependencies.
 *             - 工具栏依赖项。
 */
async function handleAddFiles(deps: ToolbarDependencies): Promise<void> {
  try {
    const currentArchive = deps.getArchivePath();
    // In the new requirements, the 'Add Files' button can also create a new archive
    if (!currentArchive) {
      // If no archive is open, create a new one
      console.log("handleAddFiles: No archive open, calling createNewArchiveDialog...");
      await createNewArchiveDialog();
      return;
    }

    // Choose files to add to the current archive
    console.log(`handleAddFiles: Archive open (${currentArchive}), selecting files to add...`);
    const filesToAdd = await invoke<string[] | null>('select_files_to_add');
    if (!filesToAdd || filesToAdd.length === 0) {
      console.log("未选择任何文件或取消了选择");
      return;
    }

    setIsLoading(true);
    try {
      // Call backend to add files to archive
      await invoke('add_files_to_archive', {
        archivePath: deps.getArchivePath(),
        filePaths: filesToAdd
      });

      // Refresh the file list
      const files = await invoke<FileItem[]>('open_archive', { 
        archivePath: deps.getArchivePath() 
      });
      setCurrentFiles(files);
      refreshUI();
      
      showSuccess(`已成功添加 ${filesToAdd.length} 个文件到压缩包`);
    } catch (error) {
      console.error("添加文件失败:", error);
      showError(`添加文件失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  } catch (error) {
    console.error("处理添加文件时出错:", error);
    showError(`添加文件操作失败: ${error}`);
  }
}

/**
 * Handles the action when the 'Cut' toolbar button is clicked.
 * 处理单击"剪切"工具栏按钮时的操作。
 */
export function handleCut(): void {
  const selectedFiles = getSelectedFiles();
  if (selectedFiles.length === 0) {
    showInfo("请先选择要剪切的文件或文件夹。");
    return;
  }

  // Store selected files in clipboard state (using global state management)
  window.sessionStorage.setItem('clipboardFiles', JSON.stringify(selectedFiles));
  window.sessionStorage.setItem('clipboardOperation', 'cut');
  
  showInfo(`已剪切 ${selectedFiles.length} 个项目到剪贴板`);
}

/**
 * Handles the action when the 'Copy' toolbar button is clicked.
 * 处理单击"复制"工具栏按钮时的操作。
 */
export function handleCopy(): void {
  const selectedFiles = getSelectedFiles();
  if (selectedFiles.length === 0) {
    showInfo("请先选择要复制的文件或文件夹。");
    return;
  }

  // Store selected files in clipboard state (using global state management)
  window.sessionStorage.setItem('clipboardFiles', JSON.stringify(selectedFiles));
  window.sessionStorage.setItem('clipboardOperation', 'copy');
  
  showInfo(`已复制 ${selectedFiles.length} 个项目到剪贴板`);
}

/**
 * Handles the action when the 'Paste' toolbar button is clicked.
 * 处理单击"粘贴"工具栏按钮时的操作。
 */
export async function handlePaste(): Promise<void> {
  const clipboardFilesJson = window.sessionStorage.getItem('clipboardFiles');
  const clipboardOperation = window.sessionStorage.getItem('clipboardOperation');
  
  if (!clipboardFilesJson || !clipboardOperation) {
    showInfo("剪贴板为空，请先复制或剪切文件。");
    return;
  }

  const clipboardFiles = JSON.parse(clipboardFilesJson);
  if (!Array.isArray(clipboardFiles) || clipboardFiles.length === 0) {
    showInfo("剪贴板中没有有效的文件。");
    return;
  }

  try {
    setIsLoading(true);
    const archivePath = getCurrentArchivePath();
    const destinationPath = ''; // 可以更改为当前浏览的文件夹路径

    // Call backend to perform paste operation
    await invoke('paste_files_in_archive', {
      archivePath,
      files: clipboardFiles,
      destination: destinationPath,
      isCut: clipboardOperation === 'cut'
    });

    // If it's a cut operation, clear the clipboard
    if (clipboardOperation === 'cut') {
      window.sessionStorage.removeItem('clipboardFiles');
      window.sessionStorage.removeItem('clipboardOperation');
    }

    // Refresh the file list
    const files = await invoke<FileItem[]>('open_archive', { archivePath });
    setCurrentFiles(files);
    refreshUI();
    
    showSuccess(`已成功粘贴 ${clipboardFiles.length} 个项目`);
  } catch (error) {
    console.error("粘贴操作失败:", error);
    showError(`粘贴失败: ${error}`);
  } finally {
    setIsLoading(false);
  }
}

/**
 * Handles the action when the 'Rename' toolbar button is clicked.
 * 处理单击"重命名"工具栏按钮时的操作。
 */
export async function handleRename(): Promise<void> {
  const selectedFiles = getSelectedFiles();
  if (selectedFiles.length !== 1) {
    showInfo("请选择一个文件或文件夹进行重命名。");
    return;
  }

  const fileToRename = selectedFiles[0];
  const fileName = fileToRename.split('/').pop() || '';
  
  // Use custom dialog for renaming
  showInputDialog({
    title: "重命名",
    message: "请输入新名称:",
    defaultValue: fileName,
    confirmBtnText: "重命名",
    cancelBtnText: "取消",
    onConfirm: async (newName: string) => {
      if (!newName || newName === fileName) {
        return;
      }

      try {
        setIsLoading(true);
        // Call backend to rename file
        await invoke('rename_file_in_archive', {
          archivePath: getCurrentArchivePath(),
          oldPath: fileToRename,
          newName
        });

        // Refresh the file list
        const files = await invoke<FileItem[]>('open_archive', { 
          archivePath: getCurrentArchivePath() 
        });
        setCurrentFiles(files);
        refreshUI();
        
        showSuccess(`已将 "${fileName}" 重命名为 "${newName}"`);
      } catch (error) {
        console.error("重命名失败:", error);
        showError(`重命名失败: ${error}`);
      } finally {
        setIsLoading(false);
      }
    }
  });
}

/**
 * Handles the action when the 'Delete' toolbar button is clicked.
 * 处理单击"删除"工具栏按钮时的操作。
 */
export function handleDelete(): void {
  const filesToDelete = getSelectedFiles();
  if (filesToDelete.length === 0) {
    showInfo("请先选择要删除的文件或文件夹。");
    return;
  }

  let confirmMessage = "";
  if (filesToDelete.length === 1) {
    // Extract the base name for single selection
    const baseName = filesToDelete[0].split('/').filter(Boolean).pop() || filesToDelete[0];
    confirmMessage = `确定要删除 "${baseName}" 吗？`;
  } else {
    confirmMessage = `确定要删除选中的 ${filesToDelete.length} 个项目吗？`;
  }

  showConfirmDialog(
    confirmMessage,
    async () => {
      try {
        setIsLoading(true);
        // Call backend to delete files
        await invoke('delete_files_in_archive', {
          archivePath: getCurrentArchivePath(),
          files: filesToDelete
        });

        // Refresh the file list
        const files = await invoke<FileItem[]>('open_archive', { 
          archivePath: getCurrentArchivePath() 
        });
        setCurrentFiles(files);
        refreshUI();
        
        showSuccess(`已成功删除 ${filesToDelete.length} 个项目`);
      } catch (error) {
        console.error("删除文件失败:", error);
        showError(`删除失败: ${error}`);
      } finally {
        setIsLoading(false);
      }
    }
  );
}

/**
 * Handles the action when the 'New Folder' toolbar button is clicked.
 * 处理单击"新建文件夹"工具栏按钮时的操作。
 */
export async function handleNewFolder(): Promise<void> {
  // Use custom dialog for folder creation
  showInputDialog({
    title: "新建文件夹",
    message: "请输入新文件夹名称:",
    defaultValue: "新建文件夹",
    confirmBtnText: "创建",
    cancelBtnText: "取消",
    onConfirm: async (folderName: string) => {
      if (!folderName) {
        return; // 用户取消
      }

      // Get current path (current path in the archive)
      const currentPath = navigationHistory.getCurrentPath();
      
      try {
        setIsLoading(true);
        // Call backend to create folder
        await invoke('create_folder_in_archive', {
          archivePath: getCurrentArchivePath(),
          folderPath: currentPath ? `${currentPath}/${folderName}` : folderName
        });

        // Refresh the file list
        const files = await invoke<FileItem[]>('open_archive', { 
          archivePath: getCurrentArchivePath() 
        });
        setCurrentFiles(files);
        refreshUI();
        
        showSuccess(`已创建文件夹 "${folderName}"`);
      } catch (error) {
        console.error("创建文件夹失败:", error);
        showError(`创建文件夹失败: ${error}`);
      } finally {
        setIsLoading(false);
      }
    }
  });
}

/**
 * Handles the action when the 'Properties' toolbar button is clicked.
 * 处理单击"属性"工具栏按钮时的操作。
 */
function handleProperties(): void {
  const selectedFiles = getSelectedFiles();
  if (selectedFiles.length === 0) {
    showInfo("请先选择要查看属性的文件或文件夹。");
    return;
  }

  // Get current file list
  const allFiles = getCurrentFiles();
  const selectedFileItems = allFiles.filter(file => selectedFiles.includes(file.name));
  
  if (selectedFileItems.length === 1) {
    // Single file properties
    const file = selectedFileItems[0];
    const fileName = file.name.split('/').pop() || file.name;
    const fileType = file.is_dir ? "文件夹" : file.type_name || "文件";
    const fileSize = file.is_dir ? "N/A" : formatFileSize(file.size);
    const modifiedDate = new Date(file.modified_date).toLocaleString();
    
    showInfo(`文件属性:
名称: ${fileName}
类型: ${fileType}
大小: ${fileSize}
修改日期: ${modifiedDate}
路径: ${file.name}`);
  } else {
    // Multiple files properties
    const folderCount = selectedFileItems.filter(file => file.is_dir).length;
    const fileCount = selectedFileItems.length - folderCount;
    const totalSize = selectedFileItems.reduce((sum, file) => sum + (file.is_dir ? 0 : file.size), 0);
    
    showInfo(`选中项属性:
文件夹数量: ${folderCount}
文件数量: ${fileCount}
总大小: ${formatFileSize(totalSize)}`);
  }
}

/**
 * Handles the action when the 'Add Folder' toolbar button is clicked.
 * 处理单击"添加文件夹"工具栏按钮时的操作。
 * 
 * @param deps - Toolbar dependencies.
 *              - 工具栏依赖项。
 */
async function handleAddFolder(deps: ToolbarDependencies): Promise<void> {
  try {
    const archivePath = deps.getArchivePath();
    if (!archivePath) {
      // In theory, the button should be disabled if there is no open archive, but just in case
      showError('请先打开或创建一个压缩包。');
      return;
    }

    // Select folders to add to the current archive
    const foldersToAdd = await invoke<string[] | null>('select_folders_to_add');
    if (!foldersToAdd || foldersToAdd.length === 0) {
      console.log("未选择任何文件夹或取消了选择");
      return;
    }

    setIsLoading(true);
    try {
      // Call backend to add folders to archive
      await invoke('add_folders_to_archive', {
        archivePath: archivePath,
        folderPaths: foldersToAdd
      });

      // Refresh the file list
      const files = await invoke<FileItem[]>('open_archive', { archivePath });
      setCurrentFiles(files);
      refreshUI();
      
      showSuccess(`已成功添加 ${foldersToAdd.length} 个文件夹到压缩包`);
    } catch (error) {
      console.error("添加文件夹失败:", error);
      showError(`添加文件夹失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  } catch (error) {
    console.error("处理添加文件夹时出错:", error);
    showError(`添加文件夹操作失败: ${error}`);
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
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
  const toolButtons = document.querySelectorAll('.tool-btn') as NodeListOf<HTMLButtonElement>;
  const extractButton = document.getElementById('extract-button') as HTMLButtonElement | null;

  // Update the state of all tool buttons
  toolButtons.forEach(button => {
    // The add button should always be available, as it can create a new archive
    if (button.title === 'Add Files' || button.title === '添加文件' || button.title === '添加') {
      button.removeAttribute('disabled');
    } else if (archiveLoaded) {
      button.removeAttribute('disabled');
    } else {
      button.setAttribute('disabled', 'true');
    }
  });

  // Special handling for the extract button (if it exists)
  if (extractButton) {
    if (archiveLoaded) {
      extractButton.removeAttribute('disabled');
    } else {
      extractButton.setAttribute('disabled', 'true');
    }
  }
} 
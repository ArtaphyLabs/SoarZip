/**
 * New Archive Dialog Module
 * 新建压缩包对话框模块
 * 
 * Provides functionality for displaying a dialog to create a new archive file,
 * allowing the user to select the archive type.
 * 提供用于显示创建新压缩包文件的对话框的功能，
 * 允许用户选择压缩包类型。
 */

import { ARCHIVE_TYPES, createNewArchive } from "../services/archiveService";
import { showError } from "./notification";
import "../styles/dialog.css";

// Store dialog element reference
let newArchiveDialog: HTMLElement | null = null;

/**
 * Creates and injects the new archive dialog HTML into the page.
 * 创建并将新建压缩包对话框的HTML注入页面。
 */
function createNewArchiveDialogElement(): void {
  // Only create the dialog if it doesn't already exist
  if (document.getElementById('new-archive-dialog')) {
    return;
  }

  const dialogHTML = `
    <div class="dialog-overlay" id="new-archive-dialog-overlay">
      <div class="dialog new-archive-dialog">
        <h2>新建压缩包</h2>
        <p>请选择要创建的压缩包类型：</p>
        <div class="archive-types-container">
          ${ARCHIVE_TYPES.map(type => `
            <div class="archive-type-item" data-value="${type.value}">
              <div class="archive-type-icon">${type.extension.toUpperCase()}</div>
              <div class="archive-type-name">${type.name}</div>
            </div>
          `).join('')}
        </div>
        <div class="dialog-buttons">
          <button id="cancel-new-archive" class="dialog-button">取消</button>
          <button id="create-new-archive" class="dialog-button primary">创建</button>
        </div>
      </div>
    </div>
  `;
  
  // Insert the dialog HTML into the body
  document.body.insertAdjacentHTML('beforeend', dialogHTML);
  
  // Cache dialog overlay element reference
  newArchiveDialog = document.getElementById('new-archive-dialog-overlay') as HTMLElement;
  
  // Set up the dialog event listeners
  setupNewArchiveDialogListeners();
  
  // Add supplementary CSS for archive type items (these are specific to this dialog)
  addArchiveTypeStyles();
}

/**
 * Sets up event listeners for the new archive dialog.
 * 为新建压缩包对话框设置事件监听器。
 */
function setupNewArchiveDialogListeners(): void {
  if (!newArchiveDialog) return;
  
  // Cancel button event listener
  const cancelButton = document.getElementById('cancel-new-archive');
  if (cancelButton) {
    cancelButton.addEventListener('click', closeNewArchiveDialog);
  }
  
  // Create button event listener
  const createButton = document.getElementById('create-new-archive');
  if (createButton) {
    createButton.addEventListener('click', handleCreateNewArchive);
  }
  
  // Archive type selection event listeners
  const archiveTypeItems = document.querySelectorAll('.archive-type-item');
  archiveTypeItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove selected class from all items
      archiveTypeItems.forEach(i => i.classList.remove('selected'));
      // Add selected class to clicked item
      item.classList.add('selected');
    });
  });
  
  // Select the first archive type by default
  if (archiveTypeItems.length > 0) {
    archiveTypeItems[0].classList.add('selected');
  }
  
  // Close dialog when clicking overlay (outside dialog)
  newArchiveDialog.addEventListener('click', (event) => {
    if (event.target === newArchiveDialog) {
      closeNewArchiveDialog();
    }
  });
}

/**
 * Adds supplementary CSS styles for archive type items.
 * 为压缩包类型项添加补充CSS样式。
 */
function addArchiveTypeStyles(): void {
  const styleId = 'new-archive-dialog-styles';
  
  // Only add styles if they don't already exist
  if (document.getElementById(styleId)) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .new-archive-dialog {
      min-width: 480px;
    }
    
    .archive-types-container {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin: 20px 0;
    }
    
    .archive-type-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      cursor: pointer;
      background-color: var(--input-background);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      width: calc(33.33% - 12px);
      transition: all 0.2s ease;
    }
    
    .archive-type-item:hover {
      background-color: var(--button-hover-background);
    }
    
    .archive-type-item.selected {
      background-color: var(--accent-color);
      color: var(--accent-text-color);
      border-color: var(--accent-color);
    }
    
    .archive-type-icon {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .archive-type-name {
      font-size: 0.9rem;
      text-align: center;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Handles the creation of a new archive when the create button is clicked.
 * 处理单击创建按钮时创建新压缩包的操作。
 */
async function handleCreateNewArchive(): Promise<void> {
  const selectedItem = document.querySelector('.archive-type-item.selected');
  if (!selectedItem) {
    showError("请选择一个压缩包类型");
    return;
  }
  
  const archiveType = selectedItem.getAttribute('data-value');
  if (!archiveType) {
    showError("无效的压缩包类型");
    return;
  }
  
  // Close the dialog before creating the archive
  closeNewArchiveDialog();
  
  // Create the new archive
  try {
    await createNewArchive(archiveType);
  } catch (error) {
    console.error("Failed to create new archive:", error);
    showError(`创建新压缩包失败: ${error}`);
  }
}

/**
 * Closes the new archive dialog.
 * 关闭新建压缩包对话框。
 */
function closeNewArchiveDialog(): void {
  if (newArchiveDialog) {
    newArchiveDialog.classList.remove('visible');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      newArchiveDialog?.remove();
      newArchiveDialog = null;
    }, 200);
  }
}

/**
 * Shows the new archive dialog, creating it first if it doesn't exist.
 * 显示新建压缩包对话框，如果对话框不存在则首先创建它。
 */
export function showNewArchiveDialog(): void {
  // Create dialog if it doesn't exist
  if (!newArchiveDialog) {
    createNewArchiveDialogElement();
  }
  
  // Show the dialog with animation
  setTimeout(() => {
    newArchiveDialog?.classList.add('visible');
  }, 10);
} 
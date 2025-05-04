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
let newArchiveDialogOverlay: HTMLElement | null = null; // Separate ref for overlay

/**
 * Creates and injects the new archive dialog HTML into the page.
 * 创建并将新建压缩包对话框的HTML注入页面。
 */
function createNewArchiveDialogElement(): void {
  // Only create the dialog if it doesn't already exist
  if (document.getElementById('new-archive-dialog-overlay')) {
    console.warn("Dialog overlay already exists. Attempting to reuse.");
    newArchiveDialogOverlay = document.getElementById('new-archive-dialog-overlay');
    newArchiveDialog = newArchiveDialogOverlay?.querySelector('.new-archive-dialog') as HTMLElement | null;
    if (!newArchiveDialog) {
      console.error("Dialog overlay exists, but dialog content is missing!");
      // Attempt to remove faulty overlay and recreate
      newArchiveDialogOverlay?.remove();
      newArchiveDialogOverlay = null; 
    } else {
      return; // Reuse existing elements
    }
  }

  console.log("Creating new archive dialog element...");
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
  newArchiveDialogOverlay = document.getElementById('new-archive-dialog-overlay');
  if (newArchiveDialogOverlay) {
      newArchiveDialog = newArchiveDialogOverlay.querySelector('.new-archive-dialog') as HTMLElement | null;
      console.log("Dialog elements created and cached.");
  } else {
      console.error("Failed to find dialog overlay after creation!");
      return;
  }
  
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
  console.log("Attempting to close new archive dialog...");
  // Use the overlay reference for removal
  if (newArchiveDialogOverlay) {
    console.log("Removing visible class from overlay...");
    newArchiveDialogOverlay.classList.remove('visible');
    
    // Use a flag to prevent removal if it's being shown again quickly
    (newArchiveDialogOverlay as any).__closing = true; 

    setTimeout(() => {
      // Check the flag before removing
      if ((newArchiveDialogOverlay as any)?.__closing) {
          console.log("Removing dialog overlay from DOM.");
          newArchiveDialogOverlay?.remove();
          newArchiveDialogOverlay = null;
          newArchiveDialog = null;
      }
    }, 300); // Increased delay slightly to match potential CSS transitions
  } else {
    console.warn("Close called but dialog overlay not found.");
  }
}

/**
 * Shows the new archive dialog, creating it first if it doesn't exist.
 * 显示新建压缩包对话框，如果对话框不存在则首先创建它。
 */
export function showNewArchiveDialog(): void {
  console.log("showNewArchiveDialog called.");
  // Create dialog if it doesn't exist or overlay was removed
  if (!newArchiveDialogOverlay) {
    console.log("Dialog overlay not found, creating...");
    createNewArchiveDialogElement();
    // Re-cache references after creation
    newArchiveDialogOverlay = document.getElementById('new-archive-dialog-overlay');
    if (newArchiveDialogOverlay) {
        newArchiveDialog = newArchiveDialogOverlay.querySelector('.new-archive-dialog');
    }
  }
  
  // Ensure dialog overlay element exists before proceeding
  if (newArchiveDialogOverlay) {
    // Reset closing flag if it was set
    (newArchiveDialogOverlay as any).__closing = false; 

    // Log styles *before* adding visible class
    const overlayStyles = window.getComputedStyle(newArchiveDialogOverlay);
    console.log(`Overlay styles BEFORE adding visible: display=${overlayStyles.display}, opacity=${overlayStyles.opacity}, visibility=${overlayStyles.visibility}`);

    // Show the dialog with animation (use requestAnimationFrame for better timing)
    requestAnimationFrame(() => {
      if (newArchiveDialogOverlay) {
        console.log("Adding 'visible' class to overlay...");
        newArchiveDialogOverlay.classList.add('visible');
        
        // Log styles *after* adding visible class (allow time for styles to apply)
        setTimeout(() => {
            if (newArchiveDialogOverlay) {
                const updatedOverlayStyles = window.getComputedStyle(newArchiveDialogOverlay);
                console.log(`Overlay styles AFTER adding visible: display=${updatedOverlayStyles.display}, opacity=${updatedOverlayStyles.opacity}, visibility=${updatedOverlayStyles.visibility}`);
            }
        }, 50); // Short delay for style application
      }
    });
  } else {
    console.error("无法获取或创建新建压缩包对话框覆盖层元素");
    showError("无法显示新建压缩包对话框。");
  }
} 
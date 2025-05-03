/**
 * Input Dialog UI Module
 * 输入对话框 UI 模块
 * 
 * Provides a reusable modal dialog for user input with a text field.
 * Manages the dialog's state, content, and callbacks for confirm/cancel actions.
 * 提供带有文本字段的可重用模态对话框，用于用户输入。
 * 管理对话框的状态、内容以及确认/取消操作的回调。
 */

/**
 * Options for the input dialog.
 * 输入对话框的选项。
 */
export interface InputDialogOptions {
  /** Dialog title. 对话框标题。 */
  title: string;
  /** Message or prompt to display. 要显示的消息或提示。 */
  message: string;
  /** Default value for the input field. 输入字段的默认值。 */
  defaultValue?: string;
  /** Text for the confirm button. 确认按钮的文本。 */
  confirmBtnText?: string;
  /** Text for the cancel button. 取消按钮的文本。 */
  cancelBtnText?: string;
  /** Callback function executed when the user confirms with input value. 用户确认时执行的回调函数，带有输入值。 */
  onConfirm: (value: string) => void;
  /** Optional callback function executed when the user cancels. 用户取消时执行的可选回调函数。 */
  onCancel?: () => void;
}

// --- DOM Element References --- 
/** Reference to the overlay element. 覆盖元素的引用。 */
let overlay: HTMLElement | null = null;
/** Reference to the dialog container. 对话框容器的引用。 */
let dialog: HTMLElement | null = null;
/** Reference to the title element. 标题元素的引用。 */
let titleElement: HTMLElement | null = null;
/** Reference to the message display element. 消息显示元素的引用。 */
let messageElement: HTMLElement | null = null;
/** Reference to the input element. 输入元素的引用。 */
let inputElement: HTMLInputElement | null = null;
/** Reference to the confirm button element. 确认按钮元素的引用。 */
let confirmBtn: HTMLElement | null = null;
/** Reference to the cancel button element. 取消按钮元素的引用。 */
let cancelBtn: HTMLElement | null = null;

// --- State --- 
/** Flag indicating if the dialog elements have been successfully initialized. 指示对话框元素是否已成功初始化的标志。 */
let isInitialized = false;
/** Flag indicating if the dialog is currently visible. 指示对话框当前是否可见的标志。 */
let isVisible = false;
/** Flag indicating if the dialog is currently in the process of hiding. 指示对话框当前是否正在隐藏过程中的标志。 */
let isHiding = false;

/**
 * Creates and adds the input dialog HTML to the document if it doesn't exist.
 * 如果输入对话框 HTML 不存在，则创建并添加到文档中。
 */
function createDialogHTML(): void {
  // Check if the dialog already exists
  if (document.getElementById('input-dialog-overlay')) {
    return;
  }

  // Create dialog structure - Mimic confirm dialog structure
  const overlayElement = document.createElement('div');
  overlayElement.id = 'input-dialog-overlay';
  overlayElement.className = 'dialog-overlay'; // Use same overlay class
  
  overlayElement.innerHTML = `
    <div id="input-dialog" class="dialog"> <!-- Use .dialog class -->
      <h2 id="input-dialog-title">Input Required</h2>
      <p id="input-dialog-message">Please provide input:</p>
      <input type="text" id="input-dialog-input" class="dialog-input" /> <!-- Keep specific input style -->
      <div class="dialog-buttons"> <!-- Use .dialog-buttons class -->
        <button id="input-dialog-cancel-btn" class="dialog-button">取消</button> <!-- Cancel first -->
        <button id="input-dialog-confirm-btn" class="dialog-button primary">确认</button> <!-- Confirm second (primary) -->
      </div>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(overlayElement);
}

/**
 * Initializes the dialog by finding necessary DOM elements and adding event listeners.
 * This function is called internally when the dialog is first shown.
 * 通过查找必要的 DOM 元素并添加事件监听器来初始化对话框。
 * 此函数在对话框首次显示时内部调用。
 */
function initializeDialog(): void {
  if (isInitialized) return;
  
  // Create dialog HTML if it doesn't exist
  createDialogHTML();

  // Get references to elements
  overlay = document.getElementById('input-dialog-overlay');
  dialog = document.getElementById('input-dialog');
  titleElement = document.getElementById('input-dialog-title');
  messageElement = document.getElementById('input-dialog-message');
  inputElement = document.getElementById('input-dialog-input') as HTMLInputElement;
  confirmBtn = document.getElementById('input-dialog-confirm-btn');
  cancelBtn = document.getElementById('input-dialog-cancel-btn');

  if (!overlay || !dialog || !titleElement || !messageElement || !inputElement || !confirmBtn || !cancelBtn) {
    console.error('Input dialog elements not found in DOM!');
    // If elements are missing, we can't proceed. isInitialized remains false.
    return;
  }

  // Add event listeners only once
  confirmBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', handleCancel);
  overlay.addEventListener('click', handleOverlayClick);
  overlay.addEventListener('transitionend', handleTransitionEnd);
  
  // Add keyboard event handler for Enter key
  inputElement.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      handleConfirm();
    }
  });

  isInitialized = true;
  console.log("Input dialog initialized.");
}

/**
 * Current callback functions
 * 当前回调函数
 */
let currentConfirmCallback: ((value: string) => void) | null = null;
let currentCancelCallback: (() => void) | null = null;

/**
 * Internal function to display the dialog with the specified content and callbacks.
 * 使用指定的内容和回调显示对话框的内部函数。
 * 
 * @param options - The dialog options.
 *                - 对话框选项。
 */
function showDialog(options: InputDialogOptions): void {
  // Ensure initialized before showing
  if (!isInitialized) {
    console.error("Attempted to show input dialog before it was initialized or failed initialization.");
    return;
  }

  // Also check elements directly in case initialization failed silently
  if (!overlay || !dialog || !titleElement || !messageElement || !inputElement || isVisible || isHiding) {
    console.warn("Input dialog cannot be shown. Elements missing, or already visible/hiding.");
    return;
  }

  // Set content
  titleElement.textContent = options.title;
  messageElement.textContent = options.message;
  inputElement.value = options.defaultValue || '';
  
  // Set button text
  if (confirmBtn) confirmBtn.textContent = options.confirmBtnText || '确认';
  if (cancelBtn) cancelBtn.textContent = options.cancelBtnText || '取消';
  
  // Store callbacks
  currentConfirmCallback = options.onConfirm;
  currentCancelCallback = options.onCancel || null;

  // Show dialog with transition
  overlay.style.display = 'flex';
  requestAnimationFrame(() => {
    overlay!.classList.add('visible');
    isVisible = true;
    
    // Focus the input field after dialog is visible
    setTimeout(() => {
      inputElement?.focus();
      inputElement?.select(); // Select all text for easy replacement
    }, 50);
  });
}

/**
 * Internal function to hide the dialog by triggering the fade-out animation.
 * 通过触发淡出动画来隐藏对话框的内部函数。
 */
function hideDialog(): void {
  if (!isVisible || isHiding || !overlay) return;

  isHiding = true;
  overlay.classList.remove('visible');
  // Actual hiding (display: none) is handled in handleTransitionEnd
}

/**
 * Event handler for the confirm button click.
 * 确认按钮点击的事件处理程序。
 */
function handleConfirm(): void {
  if (currentConfirmCallback && inputElement) {
    currentConfirmCallback(inputElement.value);
  }
  hideDialog();
}

/**
 * Event handler for the cancel button click.
 * 取消按钮点击的事件处理程序。
 */
function handleCancel(): void {
  if (currentCancelCallback) {
    currentCancelCallback();
  }
  hideDialog();
}

/**
 * Event handler for clicks on the overlay (background).
 * Closes the dialog if the click is directly on the overlay.
 * 覆盖层（背景）点击的事件处理程序。
 * 如果直接点击覆盖层，则关闭对话框。
 * 
 * @param event - The mouse click event.
 *              - 鼠标点击事件。
 */
function handleOverlayClick(event: MouseEvent): void {
  // Close only if clicking directly on the overlay, not the dialog content
  if (event.target === overlay) {
    handleCancel();
  }
}

/**
 * Event handler for the `transitionend` event on the overlay.
 * Hides the overlay completely (`display: none`) after the fade-out transition finishes.
 * 覆盖层上 `transitionend` 事件的事件处理程序。
 * 在淡出过渡结束后完全隐藏覆盖层 (`display: none`)。
 * 
 * @param event - The transition event.
 *              - 过渡事件。
 */
function handleTransitionEnd(event: TransitionEvent): void {
  // Only act on the opacity transition of the overlay itself when fading out
  if (overlay && event.target === overlay && event.propertyName === 'opacity' && !overlay.classList.contains('visible')) {
    overlay.style.display = 'none';
    isHiding = false;
    isVisible = false;
    // Clean up callbacks after visually hidden
    currentConfirmCallback = null;
    currentCancelCallback = null;
  }
}

/**
 * Public function to show the input dialog.
 * 显示输入对话框的公共函数。
 *
 * @param options - Configuration options for the dialog.
 *                - 对话框的配置选项。
 */
export function showInputDialog(options: InputDialogOptions): void {
  initializeDialog(); // Call initialize (it handles the isInitialized check)
  if (isInitialized) {
    showDialog(options);
  }
} 
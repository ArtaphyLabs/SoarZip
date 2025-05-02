/**
 * Confirm Dialog UI Module
 * 确认对话框 UI 模块
 * 
 * Provides a reusable modal dialog for confirming user actions.
 * Manages the dialog's state, content, and callbacks for confirm/cancel actions.
 * 提供可重用的模态对话框以确认用户操作。
 * 管理对话框的状态、内容以及确认/取消操作的回调。
 */

/** Callback function type for confirm action. 确认操作的回调函数类型。 */
type ConfirmCallback = () => void;
/** Optional callback function type for cancel action. 取消操作的可选回调函数类型。 */
type CancelCallback = (() => void) | null;

// --- DOM Element References --- 
/** Reference to the overlay element. 覆盖元素的引用。 */
let overlay: HTMLElement | null = null;
/** Reference to the message display element. 消息显示元素的引用。 */
let messageElement: HTMLElement | null = null;
/** Reference to the confirm button element. 确认按钮元素的引用。 */
let confirmBtn: HTMLElement | null = null;
/** Reference to the cancel button element. 取消按钮元素的引用。 */
let cancelBtn: HTMLElement | null = null;

// --- Callbacks --- 
/** Stores the current confirm callback function. 存储当前的确认回调函数。 */
let onConfirmCallback: ConfirmCallback | null = null;
/** Stores the current cancel callback function. 存储当前的取消回调函数。 */
let onCancelCallback: CancelCallback = null;

// --- State --- 
/** Flag indicating if the dialog elements have been successfully initialized. 指示对话框元素是否已成功初始化的标志。 */
let isInitialized = false;
/** Flag indicating if the dialog is currently visible. 指示对话框当前是否可见的标志。 */
let isVisible = false;
/** Flag indicating if the dialog is currently in the process of hiding. 指示对话框当前是否正在隐藏过程中的标志。 */
let isHiding = false;

/**
 * Initializes the dialog by finding necessary DOM elements and adding event listeners.
 * This function is called internally when the dialog is first shown.
 * 通过查找必要的 DOM 元素并添加事件监听器来初始化对话框。
 * 此函数在对话框首次显示时内部调用。
 */
function initializeDialog() {
    if (isInitialized) return;

    overlay = document.getElementById('confirm-dialog-overlay');
    messageElement = document.getElementById('confirm-dialog-message');
    confirmBtn = document.getElementById('confirm-dialog-confirm-btn');
    cancelBtn = document.getElementById('confirm-dialog-cancel-btn');

    if (!overlay || !messageElement || !confirmBtn || !cancelBtn) {
        console.error('Confirm dialog elements not found in DOM!');
        // If elements are missing, we can't proceed. isInitialized remains false.
        return;
    }

    // Add event listeners only once
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    overlay.addEventListener('click', handleOverlayClick);
    overlay.addEventListener('transitionend', handleTransitionEnd);

    isInitialized = true;
    console.log("Confirm dialog initialized."); // Added log for confirmation
}

/**
 * Internal function to display the dialog with the specified content and callbacks.
 * 使用指定的内容和回调显示对话框的内部函数。
 * 
 * @param message - The confirmation message text.
 *                - 确认消息文本。
 * @param onConfirm - The function to call when the confirm button is clicked.
 *                  - 点击确认按钮时调用的函数。
 * @param onCancel - The optional function to call when the dialog is cancelled.
 *                 - 对话框被取消时调用的可选函数。
 */
function showDialog(message: string, onConfirm: ConfirmCallback, onCancel?: CancelCallback) {
    // Ensure initialized before showing
    if (!isInitialized) {
        console.error("Attempted to show confirm dialog before it was initialized or failed initialization.");
        return;
    }
    // Also check elements directly in case initialization failed silently
    if (!overlay || !messageElement || isVisible || isHiding) {
        console.warn("Confirm dialog cannot be shown. Overlay or message element missing, or already visible/hiding.");
        return;
    }

    messageElement.textContent = message;
    onConfirmCallback = onConfirm;
    onCancelCallback = onCancel || null; // Store optional cancel callback

    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
        overlay!.classList.add('visible');
        isVisible = true;
    });
}

/**
 * Internal function to hide the dialog by triggering the fade-out animation.
 * 通过触发淡出动画来隐藏对话框的内部函数。
 */
function hideDialog() {
    if (!isVisible || isHiding || !overlay) return;

    isHiding = true;
    overlay.classList.remove('visible');
    // Actual hiding (display: none) is handled in handleTransitionEnd
}

/**
 * Event handler for the confirm button click.
 * 确认按钮点击的事件处理程序。
 */
function handleConfirm() {
    if (onConfirmCallback) {
        onConfirmCallback();
    }
    hideDialog();
}

/**
 * Event handler for the cancel button click.
 * 取消按钮点击的事件处理程序。
 */
function handleCancel() {
    if (onCancelCallback) {
        onCancelCallback();
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
function handleOverlayClick(event: MouseEvent) {
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
function handleTransitionEnd(event: TransitionEvent) {
    // Only act on the opacity transition of the overlay itself when fading out
    if (overlay && event.target === overlay && event.propertyName === 'opacity' && !overlay.classList.contains('visible')) {
        overlay.style.display = 'none';
        isHiding = false;
        isVisible = false;
        // Clean up callbacks after visually hidden
        onConfirmCallback = null;
        onCancelCallback = null;
    }
}

/**
 * Public function to show the confirmation dialog.
 * 显示确认对话框的公共函数。
 *
 * @param message - The message to display in the dialog.
 *                - 要在对话框中显示的消息。
 * @param onConfirm - Callback function executed when the user confirms.
 *                  - 用户确认时执行的回调函数。
 * @param onCancel - Optional callback function executed when the user cancels or closes the dialog.
 *                 - 用户取消或关闭对话框时执行的可选回调函数。
 */
export function showConfirmDialog(
    message: string,
    onConfirm: ConfirmCallback,
    onCancel?: CancelCallback
): void { // Return type is void
    initializeDialog(); // Call initialize (it handles the isInitialized check)
    if (isInitialized) {
        showDialog(message, onConfirm, onCancel);
    }
} 
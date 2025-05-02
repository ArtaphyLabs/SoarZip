/**
 * Extract Dialog UI Module
 * 解压对话框 UI 模块
 * 
 * Manages the dialog used for confirming file extraction operations.
 * Allows users to view/change the destination path before confirming or canceling.
 * 管理用于确认文件解压操作的对话框。
 * 允许用户在确认或取消之前查看/更改目标路径。
 */

// --- Type Definitions --- 
/**
 * Type definition for the 'Change Path' callback.
 * Should trigger a folder selection dialog and return the selected path or null/undefined if cancelled.
 * "更改路径"回调的类型定义。
 * 应触发文件夹选择对话框，并在取消时返回所选路径或 null/undefined。
 */
type OnChangePath = () => Promise<string | null | undefined>; 
/**
 * Type definition for the 'Confirm' callback.
 * Called with the final confirmed extraction path.
 * "确认"回调的类型定义。
 * 使用最终确认的解压路径调用。
 */
type OnConfirm = (confirmedPath: string) => void; 
/**
 * Type definition for the 'Cancel' callback.
 * Called when the dialog is cancelled or closed.
 * "取消"回调的类型定义。
 * 在对话框被取消或关闭时调用。
 */
type OnCancel = () => void; 

// --- State Variables --- 
/**
 * Stores the current extraction path displayed in the dialog.
 * 存储对话框中显示的当前解压路径。
 */
let currentPath: string = '';
/**
 * Stores the reference to the provided OnChangePath callback.
 * 存储提供的 OnChangePath 回调的引用。
 */
let onChangePathCallback: OnChangePath | null = null;
/**
 * Stores the reference to the provided OnConfirm callback.
 * 存储提供的 OnConfirm 回调的引用。
 */
let onConfirmCallback: OnConfirm | null = null;
/**
 * Stores the reference to the provided OnCancel callback.
 * 存储提供的 OnCancel 回调的引用。
 */
let onCancelCallback: OnCancel | null = null;
/**
 * Flag to prevent multiple hide actions during the transition.
 * 防止在过渡期间执行多次隐藏操作的标志。
 */
let isHiding = false; 

// --- DOM Element References --- 
// Initialized by initializeDialogElements()
// 由 initializeDialogElements() 初始化
/** Reference to the dialog overlay element. 对话框覆盖元素的引用。 */
let overlay: HTMLElement | null = null;
/** Reference to the path display/input element. 路径显示/输入元素的引用。 */
let pathInput: HTMLInputElement | null = null;
/** Reference to the 'Change Path' button element. "更改路径"按钮元素的引用。 */
let changePathBtn: HTMLElement | null = null;
/** Reference to the 'Confirm Extract' button element. "确认提取"按钮元素的引用。 */
let confirmBtn: HTMLElement | null = null;
/** Reference to the 'Cancel Extract' button element. "取消提取"按钮元素的引用。 */
let cancelBtn: HTMLElement | null = null;

/**
 * Initializes references to the dialog's DOM elements.
 * Called internally when the dialog is first shown.
 * 初始化对话框 DOM 元素的引用。
 * 在对话框首次显示时内部调用。
 */
function initializeDialogElements() {
  overlay = document.getElementById('extract-dialog-overlay')!;
  pathInput = document.getElementById('extract-path-input') as HTMLInputElement;
  changePathBtn = document.getElementById('change-path-btn')!;
  confirmBtn = document.getElementById('confirm-extract-btn')!;
  cancelBtn = document.getElementById('cancel-extract-btn')!;
}

/**
 * Public function to show the extraction confirmation dialog.
 * 显示解压确认对话框的公共函数。
 * 
 * @param defaultPath - The default extraction path to display initially.
 *                    - 初始显示的默认解压路径。
 * @param onChangePath - Callback function executed when the 'Change Path' button is clicked.
 *                     - 点击"更改路径"按钮时执行的回调函数。
 * @param onConfirm - Callback function executed when the 'Confirm' button is clicked.
 *                  - 点击"确认"按钮时执行的回调函数。
 * @param onCancel - Callback function executed when the dialog is cancelled or closed.
 *                 - 对话框被取消或关闭时执行的回调函数。
 */
export function showExtractDialog(
  defaultPath: string,
  onChangePath: OnChangePath,
  onConfirm: OnConfirm,
  onCancel: OnCancel
) {
  // Ensure elements are initialized
  if (!overlay) {
    initializeDialogElements();
  }

  // Check if elements were found (add null checks)
  if (!overlay || !pathInput || !changePathBtn || !confirmBtn || !cancelBtn) {
    console.error("Extract dialog elements not found!");
    return; // Exit if elements are missing
  }

  currentPath = defaultPath; // Set initial path
  pathInput.value = currentPath; // Display path in the input-like element
  pathInput.title = currentPath; // Set tooltip to show full path on hover

  // Store the provided callback functions
  onChangePathCallback = onChangePath;
  onConfirmCallback = onConfirm;
  onCancelCallback = onCancel;

  // Remove previous event listeners to prevent duplicates if shown multiple times
  changePathBtn.removeEventListener('click', handleChangePathClick);
  confirmBtn.removeEventListener('click', handleConfirmClick);
  cancelBtn.removeEventListener('click', handleCancelClick);
  overlay.removeEventListener('click', handleOverlayClick);
  overlay.removeEventListener('transitionend', handleTransitionEnd); // Clean up previous end listener

  // Add new event listeners for dialog interactions
  changePathBtn.addEventListener('click', handleChangePathClick);
  confirmBtn.addEventListener('click', handleConfirmClick);
  cancelBtn.addEventListener('click', handleCancelClick);
  overlay.addEventListener('click', handleOverlayClick); // Listener for clicks outside the dialog
  overlay.addEventListener('transitionend', handleTransitionEnd); // Listener for fade-out completion

  // Make the overlay element visible (it starts with opacity 0)
  overlay.style.display = 'flex';
  // Use requestAnimationFrame to ensure the 'display' change is rendered before adding the 'visible' class, triggering the CSS transition.
  requestAnimationFrame(() => {
    overlay!.classList.add('visible'); // Add class to start fade-in transition
  });
  isHiding = false; // Reset hiding flag when showing
}

/**
 * Internal function to hide the dialog by triggering the fade-out animation.
 * 通过触发淡出动画来隐藏对话框的内部函数。
 */
function hideDialog() {
  // Prevent hiding if already hiding or not visible
  // Assert overlay is not null here since we just checked
  if (isHiding || !overlay!.classList.contains('visible')) return; 
  isHiding = true; // Set flag to prevent re-entry
  overlay!.classList.remove('visible'); // Remove class to start fade-out transition
  // The actual hiding (setting display: none) is handled by the handleTransitionEnd function.
}

/**
 * Event handler for the `transitionend` event on the overlay.
 * Finalizes hiding the dialog (`display: none`) and cleans up callbacks.
 * 覆盖层上 `transitionend` 事件的事件处理程序。
 * 完成隐藏对话框 (`display: none`) 并清理回调。
 * 
 * @param event - The transition event.
 *              - 过渡事件。
 */
function handleTransitionEnd(event: TransitionEvent) {
    // Ensure the transition that ended was the opacity transition on the overlay itself
    if (overlay && event.target === overlay && event.propertyName === 'opacity' && !overlay.classList.contains('visible')) {
        overlay.style.display = 'none'; // Hide the element completely
        isHiding = false; // Reset the hiding flag

        // Clean up callback references after the dialog is visually hidden
        onChangePathCallback = null;
        onConfirmCallback = null;
        onCancelCallback = null;
    }
}

/**
 * Event handler for the 'Change Path' button click.
 * Executes the `onChangePathCallback` to open the folder selection dialog.
 * Updates the displayed path if a new one is selected.
 * "更改路径"按钮点击的事件处理程序。
 * 执行 `onChangePathCallback` 以打开文件夹选择对话框。
 * 如果选择了新路径，则更新显示的路径。
 */
async function handleChangePathClick() {
  if (onChangePathCallback) {
    try {
      // Optional: Temporarily hide or fade the dialog to make the native folder picker more prominent.
      // overlay.style.opacity = '0'; 
      
      const newPath = await onChangePathCallback(); // Await the path selection result
      
      // Optional: Restore dialog visibility if it was temporarily hidden.
      // overlay.style.opacity = '1'; 

      if (newPath) {
        // If a new path was selected, update the state and UI
        currentPath = newPath;
        pathInput!.value = currentPath;
        pathInput!.title = currentPath; // Update tooltip for the input-like element
      }
    } catch (error) {
      console.error("Error during path selection:", error);
      // Optional: Ensure dialog is visible again in case of error during temporary hiding.
      // if (overlay) overlay.style.opacity = '1';
    }
  }
}

/**
 * Event handler for the 'Confirm' button click.
 * Executes the `onConfirmCallback` with the current path and hides the dialog.
 * "确认"按钮点击的事件处理程序。
 * 使用当前路径执行 `onConfirmCallback` 并隐藏对话框。
 */
function handleConfirmClick() {
  if (onConfirmCallback) {
    onConfirmCallback(currentPath); // Pass the final selected path to the callback
  }
  hideDialog(); // Hide the dialog after confirmation
}

/**
 * Event handler for the 'Cancel' button click.
 * Executes the `onCancelCallback` and hides the dialog.
 * "取消"按钮点击的事件处理程序。
 * 执行 `onCancelCallback` 并隐藏对话框。
 */
function handleCancelClick() {
  if (onCancelCallback) {
    onCancelCallback(); // Execute the cancellation callback
  }
  hideDialog(); // Hide the dialog on cancellation
}

/**
 * Event handler for clicks on the overlay (background).
 * Closes the dialog, treating it as a cancel action.
 * 覆盖层（背景）点击的事件处理程序。
 * 关闭对话框，将其视为取消操作。
 * 
 * @param event - The mouse click event.
 *              - 鼠标点击事件。
 */
function handleOverlayClick(event: MouseEvent) {
    // Check if the click target was the overlay element itself, not a child element (like the dialog box)
    if (event.target === overlay) {
        handleCancelClick(); // Treat clicking outside as cancel
    }
} 
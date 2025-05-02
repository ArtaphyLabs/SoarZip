/**
 * Application Setup Module
 * 应用程序设置模块
 * 
 * Orchestrates the initialization of various UI components and their event listeners.
 * Connects UI elements with their corresponding service functions and state.
 * 协调各种 UI 组件及其事件监听器的初始化。
 * 将 UI 元素与其对应的服务功能和状态连接起来。
 */
import { setupWindowControls } from './windowControls';
import { setupMenuItems } from './menu';
import { setupHomeActions } from './home';
import { setupNavButtons } from './navigation';
import { setupToolbarButtons } from './toolbar';
import { setupSearch } from './search';
import { setupLogoClick } from './logo';
import { setupSettingsButton } from './settings';

// Import necessary functions/services used by setup functions
import { openArchiveDialogAndLoad, loadArchive } from '../services/archiveService'; // Assuming archiveService exports these
import { startExtractionProcess } from '../services/extractionService'; // Assuming extractionService exports this
import { 
    performSearch, 
    refreshUI, 
    navigateToFolder, 
    resetAppToHome,
    updateLoadingStatus
} from '../ui/uiManager';
import { 
    getIsLoading, 
    getCurrentArchivePath, 
    setCurrentFiles
} from '../services/appState';
import {
    navigationHistory, 
} from '../services/navigationService';

/**
 * Initializes all UI component event listeners and connects UI elements to services.
 * 初始化所有 UI 组件的事件监听器并将 UI 元素连接到服务。
 * 
 * This function calls individual setup functions for different parts of the UI,
 * passing necessary dependencies (like service functions and state getters) to them.
 * 此函数为 UI 的不同部分调用单独的设置函数，
 * 并将必要的依赖项（如服务函数和状态获取器）传递给它们。
 */
export function setupApplicationEventListeners() {
  console.log("Setting up application event listeners and component interactions...");

  // Pass necessary functions and state getters to the setup modules
  setupWindowControls();
  setupMenuItems({ openArchiveDialog: openArchiveDialogAndLoad });
  setupSearch({ performSearch }); // Pass the uiManager search function
  setupNavButtons({
      isLoading: getIsLoading,
      canGoBack: () => navigationHistory.canGoBack(),
      getPreviousPath: () => navigationHistory.getPreviousPath(),
      canGoForward: () => navigationHistory.canGoForward(),
      getNextPath: () => navigationHistory.getNextPath(),
      getCurrentPath: () => navigationHistory.getCurrentPath(),
      getParentPath: (path) => navigationHistory.getParentPath(path),
      refreshUI: refreshUI, // Pass the uiManager refresh function
      navigateToFolder: navigateToFolder, // Pass the uiManager navigation function
      getArchivePath: getCurrentArchivePath,
      updateLoadingStatus: updateLoadingStatus, // Pass the imported function
      setCurrentFiles: setCurrentFiles
  });
  setupToolbarButtons({ 
      getArchivePath: getCurrentArchivePath, 
      openArchiveDialog: openArchiveDialogAndLoad, 
      startExtraction: startExtractionProcess 
  });
  setupHomeActions({ openArchiveDialog: openArchiveDialogAndLoad });
  setupLogoClick({ 
      getArchivePath: getCurrentArchivePath, 
      resetApp: resetAppToHome // Use the uiManager reset function
  });
  setupSettingsButton({});

  console.log("Application event listeners and component interactions set up.");
}

// Export loadArchive for initial load check in main.ts
export { loadArchive }; 
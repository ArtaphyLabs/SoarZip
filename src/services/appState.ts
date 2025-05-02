/**
 * Application State Service
 * 应用程序状态服务
 * 
 * This module manages the global state of the SoarZip application, 
 * such as the currently opened archive path, file list cache, and loading status.
 * 此模块管理 SoarZip 应用程序的全局状态，
 * 例如当前打开的压缩包路径、文件列表缓存和加载状态。
 */

import { FileItem } from "./fileService";

/**
 * Holds the path of the currently opened archive file.
 * 保存当前打开的压缩包文件的路径。
 */
let currentArchivePath = "";

/**
 * Cache of the file list extracted from the current archive.
 * 从当前压缩包提取的文件列表缓存。
 */
let currentFiles: FileItem[] = [];

/**
 * Indicates whether the application is currently in a loading state (e.g., opening archive, extracting).
 * 指示应用程序当前是否处于加载状态（例如，打开压缩包、解压）。
 */
let isLoading = false;

/**
 * Gets the path of the currently opened archive.
 * 获取当前打开的压缩包的路径。
 * 
 * @returns - The archive path, or an empty string if no archive is open.
 *          - 压缩包路径，如果未打开压缩包则为空字符串。
 */
export function getCurrentArchivePath(): string {
  return currentArchivePath;
}

/**
 * Sets the path of the currently opened archive and updates related state.
 * 设置当前打开的压缩包的路径并更新相关状态。
 * 
 * @param path - The new archive path. Set to empty string to clear.
 *             - 新的压缩包路径。设置为空字符串以清除。
 */
export function setCurrentArchivePath(path: string): void {
  currentArchivePath = path;
}

/**
 * Gets the cached list of files from the currently opened archive.
 * 获取当前打开的压缩包中的缓存文件列表。
 * 
 * @returns - An array of FileItem objects representing the files.
 *          - 代表文件的 FileItem 对象数组。
 */
export function getCurrentFiles(): FileItem[] {
  return currentFiles;
}

/**
 * Sets the cached list of files from the archive.
 * 设置来自压缩包的缓存文件列表。
 * 
 * @param files - The array of FileItem objects to cache.
 *              - 要缓存的 FileItem 对象数组。
 */
export function setCurrentFiles(files: FileItem[]): void {
  currentFiles = files;
}

/**
 * Gets the current loading state of the application.
 * 获取应用程序的当前加载状态。
 * 
 * @returns - True if the application is performing a blocking operation, false otherwise.
 *          - 如果应用程序正在执行阻塞操作，则为 true，否则为 false。
 */
export function getIsLoading(): boolean {
  return isLoading;
}

/**
 * Sets the loading state of the application.
 * 设置应用程序的加载状态。
 * 
 * This typically triggers UI changes like showing a loading indicator.
 * 这通常会触发 UI 更改，例如显示加载指示器。
 * 
 * @param loading - The new loading state (true if loading, false otherwise).
 *                - 新的加载状态（如果正在加载则为 true，否则为 false）。
 */
export function setIsLoading(loading: boolean): void {
  isLoading = loading;
}

/**
 * Resets the application state to its initial values (no archive open).
 * 将应用程序状态重置为其初始值（没有打开的压缩包）。
 * 
 * Clears the archive path, file cache, and loading state.
 * 清除压缩包路径、文件缓存和加载状态。
 */
export function resetAppState(): void {
  currentArchivePath = "";
  currentFiles = [];
  isLoading = false; // Ensure loading is also reset
} 
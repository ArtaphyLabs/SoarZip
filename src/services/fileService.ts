/**
 * File Service Module
 * 文件服务模块
 * 
 * Provides core file system and archive interaction functionalities.
 * Includes opening/saving dialogs, reading archive contents, extracting files,
 * and utility functions for file list manipulation and display.
 * 提供核心的文件系统和压缩包交互功能。
 * 包括打开/保存对话框、读取压缩包内容、解压文件，
 * 以及用于文件列表操作和显示的实用函数。
 */
import { invoke } from "@tauri-apps/api/core";

/**
 * Interface representing a file or directory item within an archive.
 * 表示压缩包内文件或目录项的接口。
 */
export interface FileItem {
  /**
   * Full path of the item within the archive (e.g., 'folder/file.txt').
   * 项目在压缩包内的完整路径（例如 'folder/file.txt'）。
   */
  name: string;
  /**
   * Indicates if the item is a directory.
   * 指示该项目是否为目录。
   */
  is_dir: boolean;
  /**
   * Size of the file in bytes. For directories, this might be 0 or represent the size of directory metadata.
   * 文件大小（字节）。对于目录，这可能是 0 或表示目录元数据的大小。
   */
  size: number;
  /**
   * Last modified date of the item as an ISO 8601 formatted string.
   * 项目的最后修改日期，格式为 ISO 8601 字符串。
   */
  modified_date: string;
  /**
   * A descriptive name for the file type (e.g., 'Text Document', 'JPEG Image').
   * 文件类型的描述性名称（例如，'文本文档'，'JPEG 图像'）。
   */
  type_name: string;
}

/**
 * Opens a native file selection dialog allowing the user to choose an archive file.
 * 打开一个原生文件选择对话框，允许用户选择一个压缩包文件。
 * 
 * @returns - Promise resolving to the selected file path, or null if the dialog was cancelled.
 *          - Promise 解析为所选文件的路径，如果对话框被取消则为 null。
 * @throws - Throws an error if the dialog fails to open.
 *         - 如果对话框无法打开则抛出错误。
 */
export async function selectArchiveFile(): Promise<string | null> {
  console.log("[fileService] Attempting to open file selection dialog...");
  try {
    const result = await invoke<string | null>('select_archive_file');
    console.log(`[fileService] File selection result: ${result}`);
    return result;
  } catch (error) {
    console.error('[fileService] Failed to open file dialog:', error);
    // Rethrow the error so the caller (e.g., openArchiveDialog in main.ts) can handle it
    throw new Error(`打开文件对话框失败: ${error}`); 
  }
}

/**
 * Opens a native directory selection dialog allowing the user to choose a destination folder.
 * 打开一个原生目录选择对话框，允许用户选择一个目标文件夹。
 * 
 * Typically used for selecting where to extract archive contents.
 * 通常用于选择解压压缩包内容的位置。
 * 
 * @returns - Promise resolving to the selected directory path, or null if the dialog was cancelled.
 *          - Promise 解析为所选目录的路径，如果对话框被取消则为 null。
 */
export async function selectDestinationFolder(): Promise<string | null> {
  return await invoke<string | null>('select_destination_folder');
}

/**
 * Opens the specified archive file and retrieves a list of its contents.
 * 打开指定的压缩包文件并检索其内容列表。
 * 
 * Invokes the Rust backend command `open_archive` to handle the actual reading and parsing.
 * 调用 Rust 后端命令 `open_archive` 来处理实际的读取和解析。
 * 
 * @param archivePath - The file system path to the archive file.
 *                    - 压缩包文件的文件系统路径。
 * @returns - Promise resolving to an array of `FileItem` objects representing the archive contents.
 *          - Promise 解析为表示压缩包内容的 `FileItem` 对象数组。
 * @throws - Throws an error if the archive cannot be opened or parsed.
 *         - 如果无法打开或解析压缩包，则抛出错误。
 */
export async function openArchive(archivePath: string): Promise<FileItem[]> {
  try {
    return await invoke<FileItem[]>('open_archive', { archivePath });
  } catch (error) {
    console.error('Failed to open archive:', error);
    throw new Error(`打开压缩包失败: ${error}`);
  }
}

/**
 * Extracts files and/or folders from an archive to a specified destination directory.
 * 从压缩包中提取文件和/或文件夹到指定的目标目录。
 * 
 * Invokes the Rust backend command `extract_files`.
 * 调用 Rust 后端命令 `extract_files`。
 * 
 * @param archivePath - Path to the source archive file.
 *                    - 源压缩包文件的路径。
 * @param filesToExtract - An array of relative paths within the archive to extract. If empty, the entire archive is extracted.
 *                       - 要提取的压缩包内相对路径的数组。如果为空，则提取整个压缩包。
 * @param outputDirectory - The file system path where the files should be extracted.
 *                        - 文件应被提取到的文件系统路径。
 * @returns - Promise that resolves when the extraction is complete.
 *          - 当提取完成时解析的 Promise。
 * @throws - Throws an error if the extraction process fails.
 *         - 如果提取过程失败，则抛出错误。
 */
export async function extractFiles(
  archivePath: string,
  filesToExtract: string[],
  outputDirectory: string
): Promise<void> {
  await invoke<void>('extract_files', {
    archivePath,
    filesToExtract,
    outputDirectory,
  });
}

/**
 * Filters a list of `FileItem` objects to show only those directly within a specified folder path.
 * 过滤 `FileItem` 对象列表，仅显示指定文件夹路径下的直接子项。
 * 
 * @param files - The complete list of `FileItem` objects from the archive.
 *              - 来自压缩包的完整 `FileItem` 对象列表。
 * @param currentFolder - The relative path within the archive to filter by (e.g., 'docs/images/'). An empty string represents the root.
 *                      - 用于过滤的压缩包内相对路径（例如 'docs/images/'）。空字符串表示根目录。
 * @returns - A new array containing only the `FileItem` objects that are direct children of `currentFolder`.
 *          - 一个新数组，仅包含 `currentFolder` 的直接子 `FileItem` 对象。
 */
export function filterFilesByFolder(files: FileItem[], currentFolder: string): FileItem[] {
  console.log(`Filtering files, current folder: "${currentFolder}", total files: ${files.length}`);
  
  if (files.length === 0) {
    console.log("Warning: No files to filter!");
    return [];
  }
  
  // Output a few sample files to help with debugging
  console.log("File examples:");
  files.slice(0, 3).forEach(file => {
    console.log(`- Name: "${file.name}", Is Directory: ${file.is_dir}`);
  });
  
  // Normalize folder path for consistent formatting
  const currentFolderNormalized = currentFolder.replace(/^\/\/|\/$/, '');
  console.log(`Normalized folder path: "${currentFolderNormalized}"`);
  
  // Filter for files and direct subfolders in the current folder
  const result = files.filter(file => {
    // Remove root path from archive for uniform path handling
    const relativePath = file.name.replace(/^\/\/|\/$/, '');
    
    let shouldInclude = false;
    
    if (currentFolderNormalized === '') {
      // Root directory: only show files/folders without path separators
      shouldInclude = !relativePath.includes('/');
    } else {
      // Subdirectory: must meet these conditions:
      // 1. Must start with the current folder path
      const startsWithCurrentFolder = relativePath.startsWith(currentFolderNormalized + '/');
      
      // 2. After removing current folder path, remaining part should have no path separators (direct child)
      let isDirectChild = false;
      if (startsWithCurrentFolder) {
        const remainingPath = relativePath.substring(currentFolderNormalized.length + 1);
        isDirectChild = !remainingPath.includes('/');
      }
      
      shouldInclude = startsWithCurrentFolder && isDirectChild;
    }
    
    // Debug a few sample items
    if (files.indexOf(file) < 3) {
      console.log(`File "${file.name}" ${shouldInclude ? 'passes' : 'fails'} filter`);
    }
    
    return shouldInclude;
  });
  
  console.log(`Filtered file count: ${result.length}`);
  return result;
}

/**
 * Sorts an array of `FileItem` objects.
 * 对 `FileItem` 对象数组进行排序。
 * 
 * Directories are listed first, then files, both sorted alphabetically by name.
 * 文件夹排在前面，然后是文件，两者都按名称字母顺序排序。
 * 
 * @param files - The array of `FileItem` objects to sort.
 *              - 要排序的 `FileItem` 对象数组。
 * @returns - A new array containing the sorted `FileItem` objects.
 *          - 包含已排序 `FileItem` 对象的新数组。
 */
export function sortFiles(files: FileItem[]): FileItem[] {
  return [...files].sort((a, b) => {
    // Sort by type first: directories before files
    if (a.is_dir !== b.is_dir) {
      return a.is_dir ? -1 : 1;
    }
    // Then sort by name alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Gets the display name for a file item relative to the current folder context.
 * 获取文件项相对于当前文件夹上下文的显示名称。
 * 
 * Removes the leading path components corresponding to the `currentFolder`.
 * For root items, it just returns the base name.
 * 移除与 `currentFolder` 对应的开头路径部分。
 * 对于根目录项，它仅返回基本名称。
 * 
 * @param file - The `FileItem` object.
 *             - `FileItem` 对象。
 * @param currentFolder - The current folder path within the archive (e.g., 'docs/').
 *                      - 压缩包内的当前文件夹路径（例如 'docs/'）。
 * @returns - The display name suitable for showing in the file list (e.g., 'image.png' instead of 'docs/image.png').
 *          - 适合在文件列表中显示的名称（例如 'image.png' 而不是 'docs/image.png'）。
 */
export function getDisplayName(file: FileItem, currentFolder: string): string {
  let displayName = file.name;
  const currentFolderPrefix = currentFolder.replace(/^\/\/|\/$/, '');
  
  if (currentFolderPrefix && displayName.startsWith(currentFolderPrefix + '/')) {
    displayName = displayName.substring(currentFolderPrefix.length + 1);
  }
  
  // Remove trailing slash if present
  return displayName.replace(/\/$/, '');
}

/**
 * Gets an appropriate SVG icon string for a file based on its type (directory) or file extension.
 * 根据文件的类型（目录）或文件扩展名获取适当的 SVG 图标字符串。
 * 
 * @param file - The `FileItem` object.
 *             - `FileItem` 对象。
 * @returns - A string containing SVG markup for the corresponding file icon.
 *          - 包含相应文件图标的 SVG 标记的字符串。
 */
export function getFileIcon(file: FileItem): string {
  const commonIconProps = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="file-icon"';

  // Folder icon
  if (file.is_dir) {
    return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
            </svg>`;
  }

  // Extract extension from filename
  const parts = file.name.split('.');
  const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';

  // Select icon based on file extension
  switch (extension) {
    // Image files
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
    case 'webp':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>`;
    // Audio files
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>`;
    // Video files
    case 'mp4':
    case 'avi':
    case 'mkv':
    case 'mov':
    case 'wmv':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polygon points="22 3 16 9 12 5 8 9 2 3"></polygon> 
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              </svg>`;
    // Document files - Word
    case 'doc':
    case 'docx':
    case 'odt':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>`;
    // PDF files
    case 'pdf':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M10.4 11.9c-.3.1-.7.2-1.1.2-1.4 0-2.6-.8-2.6-2.1 0-1.2 1.1-2.1 2.5-2.1.5 0 1 .1 1.4.3"></path>
                <path d="M15.2 11.9c-.3.1-.7.2-1.1.2-1.4 0-2.6-.8-2.6-2.1 0-1.2 1.1-2.1 2.5-2.1.5 0 1 .1 1.4.3"></path>
                <path d="M12 18.4c-.7 0-1.3-.5-1.3-1.2 0-.6.4-1.2 1.3-1.2s1.3.6 1.3 1.2c0 .7-.5 1.2-1.3 1.2Z"></path>
              </svg>`;
    // Spreadsheet files
    case 'xls':
    case 'xlsx':
    case 'ods':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="10" y2="21"></line>
                <line x1="14" y1="9" x2="14" y2="21"></line>
              </svg>`;
    // Presentation files
    case 'ppt':
    case 'pptx':
    case 'odp':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>`;
    // Text files
    case 'txt':
    case 'md':
    case 'log':
    case 'ini':
    case 'cfg':
    case 'conf':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>`;
    // Archive files
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
    case 'bz2':
    case 'xz':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.1-2.4-3.8-4.6-4.4-1.8-.5-3.6-.3-5.1.5l-.5.3-4.6 3.2c-1.5.9-2.8 2.1-3.8 3.5-.9 1.3-1.3 2.8-1.1 4.3.4 2.8 2.2 5.3 4.7 6.7 1.5.8 3.1 1.2 4.7 1.2h.7c.3 0 .5-.1.7-.3l1.7-1.7c.1-.1.2-.3.2-.4 0-.2-.1-.3-.2-.4l-1.7-1.7c-.2-.2-.5-.2-.7-.1-.6.1-1.2.1-1.7-.1-2.7-.6-4.8-2.8-5.4-5.4-.4-1.9.1-3.8 1.2-5.4l4.1-2.9c.4-.3.8-.6 1.3-.8s1-.3 1.5-.3c1.3 0 2.6.5 3.6 1.4l.5.5c1.1 1 1.9 2.3 2.2 3.7.3 1.5-.1 2.9-1 4.2l-1.1 1.1c-.2.2-.2.5 0 .7l1.5 1.5c.2.2.5.2.7 0l1.1-1.1z"></path>
                <path d="M12 12 L12 6"></path> <path d="M12 12 L16 12"></path>
                <path d="M12 6 L10 8"></path> <path d="M12 6 L14 8"></path> 
              </svg>`;
    // Code files
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'html':
    case 'css':
    case 'scss':
    case 'json':
    case 'xml':
    case 'yaml':
    case 'yml':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
    case 'cs':
    case 'go':
    case 'php':
    case 'rb':
    case 'swift':
    case 'kt':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>`;
    // Executable files
    case 'exe':
    case 'bat':
    case 'sh':
    case 'app': // macOS
    case 'msi':
    case 'deb':
    case 'rpm':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>`;
    // Default file icon
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonIconProps}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>`;
  }
}

/**
 * Calculates statistics for the files and directories directly within the specified folder.
 * 计算指定文件夹内直接包含的文件和目录的统计信息。
 * 
 * @param files - The complete list of `FileItem` objects from the archive.
 *              - 来自压缩包的完整 `FileItem` 对象列表。
 * @param currentFolder - The relative path within the archive for which to calculate stats (empty string for root).
 *                      - 要计算统计信息的压缩包内相对路径（空字符串表示根目录）。
 * @returns - An object containing the count of items and the total size of files in the folder.
 *          - 一个包含文件夹中项目数量和文件总大小的对象。
 */
export function getFileStats(files: FileItem[], currentFolder: string): { count: number, totalSize: number } {
  // Filter to get only files in the current folder
  const currentFiles = files.filter(file => {
    if (currentFolder === '') {
      // Root folder: include top-level files and directories
      return !file.name.includes('/') || 
             (file.name.split('/').filter(Boolean).length === 1 && file.name.endsWith('/'));
    } else {
      // Subfolder: include only direct children
      return file.name.startsWith(currentFolder) && 
             (file.name === currentFolder || 
              file.name.substring(currentFolder.length).split('/').filter(Boolean).length <= 1);
    }
  });
  
  // Calculate statistics
  const count = currentFiles.length;
  const totalSize = currentFiles.reduce((sum, file) => sum + file.size, 0);
  
  return { count, totalSize };
} 
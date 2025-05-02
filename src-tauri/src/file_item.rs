//! Defines the data structure for representing items within an archive.
//! 定义用于表示压缩包内项目的数据结构。
use serde::{Serialize, Deserialize};

/// Represents an item (file or directory) within an archive.
/// 表示压缩包内的一个项目（文件或目录）。
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileItem {
    /// The full path of the item within the archive, using '/' as separator.
    /// 项目在压缩包内的完整路径，使用 '/' 作为分隔符。
    pub name: String,
    /// Whether the item is a directory.
    /// 项目是否为目录。
    pub is_dir: bool,
    /// The size of the item in bytes.
    /// 项目的大小（字节）。
    pub size: u64,
    /// The modification date of the item as a string (YYYY-MM-DD HH:MM:SS).
    /// 项目的修改日期字符串 (格式 YYYY-MM-DD HH:MM:SS)。
    pub modified_date: String,
    /// A descriptive name for the type of the item (e.g., "Text Document", "Folder").
    /// 项目类型的描述性名称（例如，"文本文档"，"文件夹"）。
    pub type_name: String,
} 
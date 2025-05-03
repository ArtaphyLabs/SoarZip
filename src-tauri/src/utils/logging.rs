//! Logging utilities for SoarZip.
//! SoarZip 的日志记录工具。

/// Logs an informational message to the console, only in debug builds.
/// 向控制台记录一条信息性消息，仅在调试构建中。
#[macro_export]
macro_rules! log_info {
    ($($arg:tt)*) => {
        #[cfg(debug_assertions)]
        {
            println!("[SoarZip INFO] {}", format_args!($($arg)*));
        }
    };
}

/// Logs a warning message to the standard error stream, only in debug builds.
/// 向标准错误流记录一条警告消息，仅在调试构建中。
#[macro_export]
macro_rules! log_warn {
    ($($arg:tt)*) => {
        #[cfg(debug_assertions)]
        {
            eprintln!("[SoarZip WARN] {}", format_args!($($arg)*));
        }
    };
} 

/// Logs an error message to the standard error stream, only in debug builds.
/// 向标准错误流记录一条错误消息，仅在调试构建中。
#[macro_export]
macro_rules! log_error {
    ($($arg:tt)*) => {
        #[cfg(debug_assertions)]
        {
            eprintln!("[SoarZip ERROR] {}", format_args!($($arg)*));
        }
    };
} 
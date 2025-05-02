// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// Main executable entry point for the SoarZip application.
/// SoarZip 应用程序的主可执行文件入口点。
///
/// This file sets up the environment (like disabling the console window on Windows release builds)
/// and calls the main run function from the library crate.
/// 此文件设置环境（例如在 Windows 发布版本中禁用控制台窗口）
/// 并调用库 crate 中的主运行函数。
///

/// The main function that starts the SoarZip application.
/// 启动 SoarZip 应用程序的主函数。
///
/// It simply delegates to the `run` function in the `soar_zip_lib` crate.
/// 它只是委托给 `soar_zip_lib` crate 中的 `run` 函数。
fn main() {
    soar_zip_lib::run()
}

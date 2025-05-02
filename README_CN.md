# SoarZip

[![CI](https://github.com/ArtaphyLabs/SoarZip/actions/workflows/build.yml/badge.svg)](https://github.com/ArtaphyLabs/SoarZip/actions/workflows/build.yml)

一个现代化的、跨平台的、高性能的文件归档管理器，使用 Tauri 2.0、Rust 和原生 TypeScript 构建。
旨在成为 WinRAR 和 7-Zip 的免费开源替代品。

[English](./README.md)

## ✨ 功能特性 (规划中)

*   **跨平台:** 可在 Windows、macOS 和 Linux 上原生运行。
*   **高性能:** 利用 Rust 处理压缩和解压等后端操作。
*   **广泛格式支持:** 目标是支持流行格式 (ZIP, 7z, RAR, TAR, GZ, BZ2 等)。
*   **现代化界面:** 使用 Web 技术构建的简洁直观的用户界面。
*   **文件管理:** 在压缩包内进行基本的文件浏览和管理。
*   **压缩选项:** 可配置的压缩级别和方法。
*   **解压选项:** 文件覆盖、提取到指定路径等选项。
*   **密码保护:** 支持创建和打开加密的压缩包。

## 🛠️ 技术栈

*   **框架:** [Tauri 2.0 (Stable)](https://beta.tauri.app/)
*   **后端:** [Rust](https://www.rust-lang.org/)
*   **前端:** 原生 TypeScript, HTML, CSS
*   **包管理器:** [pnpm](https://pnpm.io/)
*   **前端构建工具:** [Vite](https://vitejs.dev/)

## 🚀 开始使用

### 先决条件

*   Node.js 和 pnpm: [https://pnpm.io/installation](https://pnpm.io/installation)
*   Rust 开发环境: [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)
*   Tauri 先决条件: [https://tauri.app/start/prerequisites/](https://tauri.app/start/prerequisites/)

### 安装与开发

1.  克隆仓库:
    ```bash
    git clone https://github.com/ArtaphyLabs/SoarZip.git
    cd SoarZip
    ```
2.  安装前端依赖:
    ```bash
    pnpm install
    ```
3.  运行开发服务器:
    ```bash
    pnpm tauri dev
    ```

### 构建

构建生产版本的应用程序:

```bash
pnpm tauri build
```

可执行文件将位于 `src-tauri/target/release/`，安装包/捆绑包将位于 `src-tauri/target/release/bundle/`。

## 🤝 参与贡献

欢迎贡献！请阅读我们的 [贡献指南](./CONTRIBUTING.md) 开始。

## 📄 许可证

本项目采用 [LGPL-3.0 许可证](./LICENSE) 授权。

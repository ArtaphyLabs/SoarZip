# SoarZip

[![CI](https://github.com/ArtaphyLabs/SoarZip/actions/workflows/build.yml/badge.svg)](https://github.com/ArtaphyLabs/SoarZip/actions/workflows/build.yml)

A modern, cross-platform, high-performance file archiver built with Tauri 2.0, Rust, and Vanilla TypeScript.
Designed as a free and open-source alternative to WinRAR and 7-Zip.

[简体中文](./README_CN.md)

## ✨ Features (Planned)

*   **Cross-Platform:** Runs natively on Windows, macOS, and Linux.
*   **High Performance:** Leverages Rust for backend operations like compression and decompression.
*   **Wide Format Support:** Aims to support popular formats (ZIP, 7z, RAR, TAR, GZ, BZ2, etc.).
*   **Modern UI:** Clean and intuitive user interface built with web technologies.
*   **File Management:** Basic file browsing and management within archives.
*   **Compression Options:** Configurable compression levels and methods.
*   **Extraction Options:** Options for overwriting files, extracting to specific paths.
*   **Password Protection:** Support for creating and opening encrypted archives.

## 🛠️ Tech Stack

*   **Framework:** [Tauri 2.0 (Stable)](https://beta.tauri.app/)
*   **Backend:** [Rust](https://www.rust-lang.org/)
*   **Frontend:** Vanilla TypeScript, HTML, CSS
*   **Package Manager:** [pnpm](https://pnpm.io/)
*   **Bundler (Frontend):** [Vite](https://vitejs.dev/)

## 🚀 Getting Started

### Prerequisites

*   Node.js and pnpm: [https://pnpm.io/installation](https://pnpm.io/installation)
*   Rust development environment: [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)
*   Tauri prerequisites: [https://tauri.app/start/prerequisites/](https://tauri.app/start/prerequisites/)

### Installation & Development

1.  Clone the repository:
    ```bash
    git clone https://github.com/ArtaphyLabs/SoarZip.git
    cd SoarZip
    ```
2.  Install frontend dependencies:
    ```bash
    pnpm install
    ```
3.  Run the development server:
    ```bash
    pnpm tauri dev
    ```

### Building

To build the application for production:

```bash
pnpm tauri build
```

The executable will be located in `src-tauri/target/release/` and the installer/bundle in `src-tauri/target/release/bundle/`.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./CONTRIBUTING.md) to get started.

## 📄 License

This project is licensed under the [LGPL-3.0 License](./LICENSE).

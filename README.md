# 🚀 Real-Time Developer Collaboration Platform

> **A cross-platform desktop & web collaboration suite for software engineering teams and students.**  
> Built with **Electron, React, TypeScript, Tailwind CSS, Monaco Editor, Yjs CRDTs, and Firebase**.

---

## 📌 Project Overview
The **Developer Collaboration Platform** is a major college project engineered to provide a low-latency, real-time pair-programming environment. Combining the performance of Electron's native desktop integration with the reactivity of modern React, the platform synchronizes multi-file code editing, system whiteboard drawings, native screen sharing, and peer communications under a unified workspace.

---

## 🏛️ System Architecture

```
+-------------------------------------------------------------------------+
|                         ELECTRON DESKTOP RUNTIME                        |
|                                                                         |
|  +-------------------------+            +----------------------------+  |
|  |   MAIN PROCESS (Node)   |            |    PRELOAD BRIDGE (CJS)    |  |
|  | - desktopCapturer       | <--------> | - contextBridge            |  |
|  | - Window Lifecycle      |    IPC     | - Safe electronAPI exposure|  |
|  | - Embedded Yjs Server   |            +--------------+-------------+  |
|  +------------+------------+                           |                |
|               |                                        |                |
|               | Local WebSocket (ws://localhost:1234)  |                |
|               v                                        v                |
|  +-------------------------------------------------------------------+  |
|  |                       RENDERER PROCESS (React 19)                 |  |
|  |                                                                   |  |
|  |  +--------------------+  +------------------+  +---------------+  |  |
|  |  |   SidebarOne/Two   |  | Playground (Tabs)|  |   VideoCall   |  |  |
|  |  | - Organizations    |  | - Monaco Editor  |  | - WebRTC Cam  |  |  |
|  |  | - Project Files    |  | - Terminal Runner|  | - Mic Toggle  |  |  |
|  |  | - File Badges      |  | - tldraw Board   |  | - In-room Chat|  |  |
|  |  +--------------------+  +------------------+  +---------------+  |  |
|  |                             ^        ^                            |  |
|  |                             |        |                            |  |
|  |             +---------------+        +---------------+            |  |
|  |             v                                        v            |  |
|  |     [RoomContext (Yjs)]                     [AuthContext (Auth)]  |  |
|  +-------------+----------------------------------------+------------+  |
+----------------|----------------------------------------|---------------+
                 |                                        |
                 v                                        v
     +-----------------------+              +---------------------------+
     |   Yjs Signaling Hub   |              |    Google Firebase Auth   |
     | - Conflict-Free CRDTs |              | - User Authentication     |
     | - Remote Awareness    |              | - Token Management        |
     | - In-Room Text Chat   |              | - Spark Free Cloud Tier   |
     +-----------------------+              +---------------------------+
```

---

## 📅 12-Week Milestone Breakdown

| Week | Focus Area | Key Deliverables |
| :--- | :--- | :--- |
| **Week 1-6** | **Foundation & Layout** | Vite + React + Electron boilerplate, Tailwind CSS styling, `SidebarOne`, `SidebarTwo`, and `Playground` scaffolding. |
| **Week 7** | **System Architecture & Sync** | Process separation (Main, Preload, Renderer), Yjs WebSocket server, Monaco binding (`y-monaco`), tldraw Whiteboard, native screen share bridge. |
| **Week 8** | **Security & Room Management** | Firebase Authentication integration (`AuthContext`), Login/Register views, Dashboard for dynamic Room ID generation and joining. |
| **Week 9** | **Multi-File Project Workspace** | `SidebarTwo` File Explorer (`+ New File`, delete, badges), persistent multi-tab bar, per-file Yjs CRDT model sync (`file:<id>`). |
| **Week 10** | **Communication & Media Suite** | Camera & mic hardware controls, live user presence indicators, real-time in-room text chat, universal screen share fallback. |
| **Week 11** | **Code Execution & Packaging** | In-browser code runner (`codeRunner.ts`), interactive Terminal output console, `.env` cloud-ready configuration, standalone desktop packaging via `electron-builder`. |
| **Week 12** | **Final Polish, Testing & Docs** | Comprehensive automated test suite (`tests/platform.test.mjs`), keyboard shortcuts modal (`?`), UI polish, and formal academic documentation. |

---

## ✨ Core Features

### 1. Synchronized Multi-File Code Editor
* **Monaco Engine:** Industry-standard editing experience (TypeScript, JavaScript, CSS, HTML, JSON, Markdown).
* **CRDT Synchronization:** Powered by Yjs — simultaneous edits merge deterministically without data loss or locking.
* **Multi-Tab Workspace:** Open multiple files simultaneously; each maintains its own independent Yjs document stream.
* **Awareness & Remote Cursors:** Online teammates are assigned distinct avatar colors with real-time cursor presence.

### 2. Built-in Code Runner & Terminal
* **Instant Execution:** Click **`▶ Run`** or press **`Cmd+Enter` / `Ctrl+Enter`** to execute the active file.
* **Type-Stripped Execution:** Runs TypeScript, JavaScript, and JSON algorithms directly in a sandboxed execution context.
* **Interactive Monospace Console:** Displays timestamps, log levels (`log`, `warn`, `error`, `info`), execution durations in milliseconds, and returned values.

### 3. Collaborative Whiteboard
* Built on **`@tldraw/tldraw`**.
* Toggle smoothly between code editing and system design diagramming with a single click.
* Retains state locally via `IndexeddbPersistence` so work is preserved offline.

### 4. Communication & Peer Presence
* **Camera & Mic Controls:** Toggle webcam preview and audio stream natively.
* **Real-Time Text Chat:** Synchronized in-room chat array allows teammates to share snippets, links, and notes.
* **Active User Roster:** Lists all connected users in room `#<roomId>` with online status badges.

### 5. Native Desktop Screen Sharing
* Connects through Electron's native `desktopCapturer` to let users choose specific application windows or full monitors.
* Automatically falls back to standard web `navigator.mediaDevices.getDisplayMedia` when opened in a standard web browser.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`Cmd/Ctrl + Enter`** | **Run Code** in the active editor file |
| **`Cmd/Ctrl + B`** | **Toggle Sidebars** (File Explorer & Organizations) |
| **`?`** | Open **Shortcuts & Help Modal** |
| **`Escape`** | Close any open modal / dialog |

---

## 🛠️ Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **npm**: v8.0.0 or higher

### Installation
```bash
git clone <repository-url>
cd developer_collab_platform
npm install
```

### Development (Start Vite + Electron + Signaling Server)
```bash
# Starts frontend, Electron desktop app, and WebSocket server simultaneously:
npm run dev:desktop
# or
npm run dev:all
```

### Running Automated Tests
```bash
npm test
```
*Validates file type resolution, in-browser code execution, JSON validation, and Yjs CRDT real-time multi-peer synchronization.*

### Standalone Desktop Packaging (`electron-builder`)
```bash
# Compile and package unpacked macOS application bundle:
npm run package:dir
# Output generated in: release/mac-arm64/DeveloperCollabPlatform.app

# Generate macOS installer (.dmg, .zip):
npm run package:mac

# Generate Windows installer (.exe):
npm run package:win
```

---

## 🧪 Demonstration & Viva Script (For College Evaluators)

1. **Launch the platform:** Run `npm run dev:desktop`.
2. **Authentication:** Sign in using an email/password or create a new account.
3. **Room Creation:** On the Dashboard, click **"+ Create New Room"** (or join an existing Room ID).
4. **Multi-Peer Sync Demo:**
   * Open `http://localhost:5173` in Google Chrome and join the same Room ID.
   * Type in the desktop app; observe changes and cursors appearing synchronously in the browser.
5. **Multi-File Workspace:** Click `+` under **Project Files** in the sidebar to create `demo.ts`. Switch tabs seamlessly.
6. **Code Execution:** Press `Cmd + Enter` or click `▶ Run` to show the Terminal drawer popping up with formatted console outputs.
7. **Whiteboard:** Switch view to **Whiteboard** and draw system architectures.
8. **Screen Sharing:** Click **🖥️ Share Screen** to demonstrate native window stream capture.

---

## 📜 Academic Integrity & License
This project was developed for the College Major Project curriculum.  
Licensed under the **MIT License**.

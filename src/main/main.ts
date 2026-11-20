import { app, BrowserWindow, ipcMain, desktopCapturer } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { startSignalingServer } from "../server/y-server.js";

// Emulate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const win = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            preload: path.join(__dirname, "../preload/preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    if (app.isPackaged) {
        win.loadFile(path.join(app.getAppPath(), "dist/index.html"));
    } else {
        win.loadURL("http://localhost:5173");
    }
}

app.whenReady().then(async () => {
    try {
        await startSignalingServer(1234);
    } catch (e) {
        console.log("[Electron Main] Signaling server startup:", e);
    }
    // Register the IPC handler for desktop capturer
    ipcMain.handle("get-desktop-sources", async () => {
        const sources = await desktopCapturer.getSources({ types: ["window", "screen"] });
        return sources.map(source => ({
            id: source.id,
            name: source.name,
            thumbnail: source.thumbnail.toDataURL()
        }));
    });

    createWindow();
});

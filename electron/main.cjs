const { app, BrowserWindow, Menu, globalShortcut } = require("electron");
const path = require("path");

// 게시된 웹 앱 URL (배포 후 변경 가능)
const APP_URL =
  process.env.SEOMRI_URL ||
  "https://id-preview--50324e82-53ad-40e9-8dc3-36a4ceff1e2b.lovable.app";

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "섭리 웹북",
    icon: path.join(__dirname, "icon.png"),
    backgroundColor: "#0b0b10",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: false,
    },
  });

  // 화면 캡처 차단 (Windows/macOS).
  // - Windows: Win+Shift+S, PrintScreen, OBS/Zoom 화면 공유 → 검은 화면
  // - macOS: Cmd+Shift+3/4/5 캡처 결과가 검은 화면
  try {
    mainWindow.setContentProtection(true);
  } catch (e) {
    console.warn("setContentProtection failed:", e);
  }

  Menu.setApplicationMenu(null);
  mainWindow.loadURL(APP_URL);

  // 외부 링크는 시스템 브라우저로
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });

  // 우클릭 메뉴 차단
  mainWindow.webContents.on("context-menu", (e) => e.preventDefault());
}

app.whenReady().then(() => {
  createWindow();

  // 개발자 도구 단축키 차단
  ["CommandOrControl+Shift+I", "F12", "CommandOrControl+Shift+J"].forEach((k) => {
    globalShortcut.register(k, () => {});
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => globalShortcut.unregisterAll());

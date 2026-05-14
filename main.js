const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 620,
    minWidth: 700,
    minHeight: 500,
    resizable: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setTimeout(() => {
    checkForUpdates();
  }, 3000);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

function checkForUpdates() {
  autoUpdater.checkForUpdates().catch(() => {});
}

ipcMain.on('check-for-updates', () => {
  checkForUpdates();
});

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

autoUpdater.on('checking-for-update', () => {
  sendToRenderer('update-status', { status: 'checking' });
});

autoUpdater.on('update-available', (info) => {
  sendToRenderer('update-status', { status: 'available', version: info.version });
});

autoUpdater.on('update-not-available', () => {
  sendToRenderer('update-status', { status: 'not-available' });
});

autoUpdater.on('download-progress', (progress) => {
  sendToRenderer('update-status', { status: 'downloading', percent: Math.round(progress.percent) });
});

autoUpdater.on('update-downloaded', () => {
  sendToRenderer('update-status', { status: 'downloaded' });
});

autoUpdater.on('error', (err) => {
  const msg = err?.message || '';
  let userMessage;

  if (msg.includes('404') || msg.includes('net::ERR')) {
    userMessage = '업데이트 서버에 연결할 수 없습니다.';
  } else if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
    userMessage = '인터넷 연결을 확인해주세요.';
  } else {
    userMessage = '업데이트 확인 중 오류가 발생했습니다.';
  }

  sendToRenderer('update-status', { status: 'error', message: userMessage });
});

function sendToRenderer(channel, data) {
  mainWindow?.webContents?.send(channel, data);
}

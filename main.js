const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;

// 자동 업데이트 설정
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

  // 앱 시작 시 업데이트 확인
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

// ── 윈도우 컨트롤 ──
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

// ── 앱 정보 ──
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// ── 자동 업데이트 ──
function checkForUpdates() {
  autoUpdater.checkForUpdates().catch((err) => {
    console.log('Update check failed:', err?.message);
  });
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
  sendToRenderer('update-status', { status: 'checking', message: '업데이트 확인 중...' });
});

autoUpdater.on('update-available', (info) => {
  sendToRenderer('update-status', {
    status: 'available',
    message: `새로운 업데이트가 있습니다! (v${info.version})`,
    version: info.version,
  });
});

autoUpdater.on('update-not-available', () => {
  sendToRenderer('update-status', {
    status: 'not-available',
    message: '현재 최신 버전입니다.',
  });
});

autoUpdater.on('download-progress', (progress) => {
  sendToRenderer('update-status', {
    status: 'downloading',
    message: `다운로드 중... ${Math.round(progress.percent)}%`,
    percent: Math.round(progress.percent),
  });
});

autoUpdater.on('update-downloaded', () => {
  sendToRenderer('update-status', {
    status: 'downloaded',
    message: '업데이트 다운로드 완료! 지금 설치하시겠습니까?',
  });
});

autoUpdater.on('error', (err) => {
  const msg = err?.message || '';
  let userMessage;

  if (msg.includes('404') || msg.includes('net::ERR')) {
    userMessage = '업데이트 서버에 연결할 수 없습니다. 배포된 릴리스가 없거나 네트워크 문제입니다.';
  } else if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
    userMessage = '인터넷 연결을 확인해주세요.';
  } else if (msg.includes('authentication') || msg.includes('token')) {
    userMessage = '인증 오류가 발생했습니다. 관리자에게 문의하세요.';
  } else {
    userMessage = '업데이트 확인 중 오류가 발생했습니다.';
  }

  sendToRenderer('update-status', {
    status: 'error',
    message: userMessage,
  });
});

function sendToRenderer(channel, data) {
  mainWindow?.webContents?.send(channel, data);
}

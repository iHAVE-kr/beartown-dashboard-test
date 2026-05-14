// ── DOM 요소 ──
const $ = (id) => document.getElementById(id);

const btnMinimize = $('btn-minimize');
const btnMaximize = $('btn-maximize');
const btnClose = $('btn-close');

const versionBadge = $('version-badge');
const updateMessage = $('update-message');
const progressContainer = $('progress-container');
const progressBar = $('progress-bar');
const btnCheckUpdate = $('btn-check-update');
const btnDownloadUpdate = $('btn-download-update');
const btnInstallUpdate = $('btn-install-update');

const infoPlatform = $('info-platform');
const infoArch = $('info-arch');
const infoVersion = $('info-version');
const infoTime = $('info-time');
const btnRefreshInfo = $('btn-refresh-info');

// ── 윈도우 컨트롤 ──
btnMinimize.addEventListener('click', () => window.electronAPI.minimize());
btnMaximize.addEventListener('click', () => window.electronAPI.maximize());
btnClose.addEventListener('click', () => window.electronAPI.close());

// ── 앱 버전 표시 ──
async function loadVersion() {
  const version = await window.electronAPI.getAppVersion();
  versionBadge.textContent = `v${version}`;
  infoVersion.textContent = `v${version}`;
}
loadVersion();

// ── 시스템 정보 ──
function refreshSystemInfo() {
  infoPlatform.textContent = navigator.platform || '-';
  infoArch.textContent = navigator.userAgent.includes('x64') ? 'x64'
    : navigator.userAgent.includes('arm') ? 'ARM' : navigator.platform;

  const now = new Date();
  infoTime.textContent = now.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
refreshSystemInfo();

btnRefreshInfo.addEventListener('click', refreshSystemInfo);

// 시간 자동 갱신
setInterval(() => {
  const now = new Date();
  infoTime.textContent = now.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}, 1000);

// ── 업데이트 ──
btnCheckUpdate.addEventListener('click', () => {
  updateMessage.textContent = '업데이트 확인 중...';
  updateMessage.className = 'update-message status-checking';
  btnCheckUpdate.disabled = true;
  window.electronAPI.checkForUpdates();
});

btnDownloadUpdate.addEventListener('click', () => {
  window.electronAPI.downloadUpdate();
  btnDownloadUpdate.style.display = 'none';
});

btnInstallUpdate.addEventListener('click', () => {
  window.electronAPI.installUpdate();
});

window.electronAPI.onUpdateStatus((data) => {
  btnCheckUpdate.disabled = false;

  // 버튼 상태 초기화
  btnDownloadUpdate.style.display = 'none';
  btnInstallUpdate.style.display = 'none';
  progressContainer.style.display = 'none';

  // 상태별 메시지 및 스타일
  updateMessage.className = 'update-message';

  switch (data.status) {
    case 'available':
      updateMessage.textContent = '구버전입니다, 아래 업데이트 버튼을 눌러 최신버전으로 업데이트해주세요!';
      updateMessage.classList.add('status-outdated');
      btnDownloadUpdate.style.display = 'inline-block';
      break;

    case 'downloading':
      updateMessage.textContent = `다운로드 중... ${data.percent || 0}%`;
      updateMessage.classList.add('status-downloading');
      progressContainer.style.display = 'block';
      progressBar.style.width = `${data.percent || 0}%`;
      break;

    case 'downloaded':
      updateMessage.textContent = '업데이트 다운로드 완료! 아래 버튼을 눌러 설치해주세요.';
      updateMessage.classList.add('status-downloaded');
      btnInstallUpdate.style.display = 'inline-block';
      break;

    case 'not-available':
      updateMessage.textContent = '최신버전입니다!';
      updateMessage.classList.add('status-latest');
      break;

    case 'error':
      updateMessage.textContent = data.message;
      updateMessage.classList.add('status-error');
      break;

    default:
      updateMessage.textContent = data.message;
      break;
  }
});

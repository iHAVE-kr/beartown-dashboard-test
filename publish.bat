@echo off
chcp 65001 >nul
title BearTown - GitHub 배포

set GH_TOKEN=***REMOVED***

echo ============================================
echo   BearTown Dashboard Test - GitHub 배포
echo ============================================
echo.

:: 실행중인 앱 프로세스 강제 종료
echo [1/4] 실행 중인 앱 종료...
taskkill /F /IM "BearTown Dashboard Test.exe" >nul 2>&1
timeout /t 2 /nobreak >nul

:: dist 폴더 삭제
echo [2/4] 이전 빌드 정리...
if exist dist (
    rmdir /S /Q dist
)

:: 현재 버전 표시
echo [3/4] 빌드 및 배포 시작...
for /f "tokens=2 delims=:, " %%a in ('findstr "version" package.json') do (
    set CURRENT_VERSION=%%~a
    goto :found
)
:found
echo   현재 버전: %CURRENT_VERSION%
echo.

:: 빌드 + 배포
call npx electron-builder --win --publish always

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================
    echo   배포 실패! 위 에러 메시지를 확인하세요.
    echo ============================================
    echo.
    pause
    exit /b 1
)

echo.
echo [4/4] Draft 릴리스를 정식 공개 중...

:: GitHub API로 Draft 릴리스를 찾아서 publish
for /f "usebackq delims=" %%i in (`powershell -Command "(Invoke-RestMethod -Uri 'https://api.github.com/repos/iHAVE-kr/beartown-dashboard-test/releases' -Headers @{Authorization='token %GH_TOKEN%'} | Where-Object { $_.draft -eq $true } | Select-Object -First 1).id"`) do set RELEASE_ID=%%i

if defined RELEASE_ID (
    powershell -Command "Invoke-RestMethod -Method Patch -Uri 'https://api.github.com/repos/iHAVE-kr/beartown-dashboard-test/releases/%RELEASE_ID%' -Headers @{Authorization='token %GH_TOKEN%'; 'Content-Type'='application/json'} -Body '{\"draft\": false}'" >nul 2>&1
    echo   Draft 릴리스 공개 완료!
) else (
    echo   릴리스가 이미 공개 상태입니다.
)

echo.
echo ============================================
echo   배포 완료! GitHub Releases 확인하세요.
echo   https://github.com/iHAVE-kr/beartown-dashboard-test/releases
echo ============================================

echo.
pause

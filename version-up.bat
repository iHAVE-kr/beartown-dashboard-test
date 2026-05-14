@echo off
chcp 65001 >nul
title BearTown - 버전 업 + 배포

set GH_TOKEN=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

echo ============================================
echo   BearTown Dashboard Test - 버전 업 + 배포
echo ============================================
echo.

:: 현재 버전 표시
for /f "tokens=2 delims=:, " %%a in ('findstr "version" package.json') do (
    echo   현재 버전: %%~a
    goto :show
)
:show
echo.
echo   새 버전을 입력하세요 (예: 1.2.0)
set /p NEW_VERSION="   새 버전: "

if "%NEW_VERSION%"=="" (
    echo   버전을 입력하지 않았습니다. 종료합니다.
    pause
    exit /b 1
)

:: package.json 버전 변경
echo.
echo [1/5] 버전 변경: %NEW_VERSION%
call npm version %NEW_VERSION% --no-git-tag-version

:: 실행중인 앱 프로세스 강제 종료
echo [2/5] 실행 중인 앱 종료...
taskkill /F /IM "BearTown Dashboard Test.exe" >nul 2>&1
timeout /t 2 /nobreak >nul

:: dist 폴더 삭제
echo [3/5] 이전 빌드 정리...
if exist dist (
    rmdir /S /Q dist
)

:: 빌드 + 배포
echo [4/6] 빌드 및 배포 시작...
echo.
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
echo [5/6] Draft 릴리스를 정식 공개 중...

for /f "usebackq delims=" %%i in (`powershell -Command "(Invoke-RestMethod -Uri 'https://api.github.com/repos/iHAVE-kr/beartown-dashboard-test/releases' -Headers @{Authorization='token %GH_TOKEN%'} | Where-Object { $_.draft -eq $true } | Select-Object -First 1).id"`) do set RELEASE_ID=%%i

if defined RELEASE_ID (
    powershell -Command "Invoke-RestMethod -Method Patch -Uri 'https://api.github.com/repos/iHAVE-kr/beartown-dashboard-test/releases/%RELEASE_ID%' -Headers @{Authorization='token %GH_TOKEN%'; 'Content-Type'='application/json'} -Body '{\"draft\": false}'" >nul 2>&1
    echo   Draft 릴리스 공개 완료!
) else (
    echo   릴리스가 이미 공개 상태입니다.
)

echo.
echo [6/6] Git 커밋...
git add -A
git commit -m "v%NEW_VERSION%"
git push

echo.
echo ============================================
echo   v%NEW_VERSION% 배포 완료!
echo   https://github.com/iHAVE-kr/beartown-dashboard-test/releases
echo ============================================

echo.
pause

@echo off
chcp 65001 >nul
title BearTown - 로컬 빌드

echo ============================================
echo   BearTown Dashboard Test - 로컬 빌드
echo ============================================
echo.

:: 실행중인 앱 프로세스 강제 종료
echo [1/3] 실행 중인 앱 종료...
taskkill /F /IM "BearTown Dashboard Test.exe" >nul 2>&1
timeout /t 2 /nobreak >nul

:: dist 폴더 삭제
echo [2/3] 이전 빌드 정리...
if exist dist (
    rmdir /S /Q dist
)

:: 빌드 (배포 안함, 로컬만)
echo [3/3] 빌드 시작...
echo.
call npx electron-builder --win

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo   빌드 완료!
    echo   설치파일: dist\BearTown Dashboard Test Setup %CURRENT_VERSION%.exe
    echo   폴더: dist\win-unpacked\
    echo ============================================
) else (
    echo.
    echo ============================================
    echo   빌드 실패! 위 에러 메시지를 확인하세요.
    echo ============================================
)

echo.
pause

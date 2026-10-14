@echo off
setlocal enabledelayedexpansion
title YouTube Desktop - Build System
cls

echo =========================================================
echo       YOUTUBE DESKTOP - SISTEM BUILD OTOMATIS
echo =========================================================
echo.
echo Pilih jenis build yang ingin Anda buat:
echo.
echo   [1] Build Versi STANDALONE INSTALLER (Inno Setup Compiler)
echo       - Menghasilkan installer pack resmi (.exe setup wizard)
echo       - Dilengkapi icon desktop, start menu, dan uninstaller
echo       - Memaketkan engine yt-dlp & FFmpeg untuk offline use
echo.
echo   [2] Build Versi PORTABLE (Full Offline Bundle ZIP ^& Folder)
echo       - Siap pakai tanpa instalasi (Zero-Setup)
echo       - 100%% Plug ^& Play, siap ditaruh di flashdisk / USB
echo       - Termasuk yt-dlp.exe, ffmpeg.exe, ffprobe.exe
echo.
echo   [3] Build KEDUANYA (Standalone Installer + Portable ZIP)
echo       - Mengompilasi kedua paket sekaligus ke folder 'dist\'
echo.
echo   [4] Build untuk Linux (Memerlukan Docker berjalan)
echo.
echo   [5] Bersihkan Hasil Build (Clean dist ^& cache)
echo.
echo   [6] Keluar
echo.
echo =========================================================
set /p choice="Masukkan nomor pilihan (1-6): "

if "%choice%"=="1" (
    echo.
    echo Menjalankan build STANDALONE INSTALLER (Inno Setup)...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build_packages.ps1" -Target standalone
    goto end
)

if "%choice%"=="2" (
    echo.
    echo Menjalankan build versi PORTABLE...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build_packages.ps1" -Target portable
    goto end
)

if "%choice%"=="3" (
    echo.
    echo Menjalankan build KEDUA VERSI (Standalone Installer + Portable)...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build_packages.ps1" -Target all
    goto end
)

if "%choice%"=="4" (
    echo.
    echo Membangun frontend...
    cd frontend
    call npm run build
    cd ..
    echo Membangun Wails untuk Linux...
    wails build -clean -x -platform linux/amd64
    goto end
)

if "%choice%"=="5" (
    echo.
    echo Membersihkan build...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build_packages.ps1" -Target clean
    goto end
)

if "%choice%"=="6" (
    exit /b
)

echo Pilihan tidak valid.
pause
exit /b

:end
echo.
pause

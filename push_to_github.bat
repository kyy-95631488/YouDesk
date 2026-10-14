@echo off
title Push to GitHub
cd /d "%~dp0"
echo ========================================================
echo        PUSH YOUTUBE DESKTOP (YOUDESK) KE GITHUB
echo ========================================================
echo.
echo Menjalankan git push ke repository:
echo https://github.com/kyy-95631488/YouDesk.git
echo.
echo Jendela login GitHub (Git Credential Manager) akan muncul...
echo.
git push -u origin main
echo.
echo ========================================================
pause

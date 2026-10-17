@echo off
set "PATH=%PATH%;C:\Program Files\nodejs;F:\MinGit\cmd"
title JUDGE Educational Platform - Dev Server
echo ====================================================
echo Starting JUDGE Educational Platform (Eng. Elkady)
echo ====================================================
echo.
cd /d "%~dp0"
call "C:\Program Files\nodejs\npm.cmd" run dev
pause

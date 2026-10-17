@echo off
set "PATH=%PATH%;C:\Program Files\nodejs;F:\MinGit\cmd"
title Deploy JUDGE to GitHub
echo ========================================================
echo Pushing JUDGE to https://github.com/itsamekadio/judge
echo ========================================================
echo.
cd /d "%~dp0"
git push -u origin main
echo.
echo ========================================================
echo Done! Go to: https://github.com/itsamekadio/judge
echo Then: Settings -^> Pages -^> Source: select GitHub Actions
echo ========================================================
pause

@echo off
cd /d "%~dp0"
echo ==== NODE VERSION ==== > build-log.txt 2>&1
node --version >> build-log.txt 2>&1
echo ==== NPM VERSION ==== >> build-log.txt 2>&1
call npm --version >> build-log.txt 2>&1
echo ==== BUILD ==== >> build-log.txt 2>&1
call npm --prefix frontend\client run build >> build-log.txt 2>&1
echo ==== EXIT CODE %ERRORLEVEL% ==== >> build-log.txt 2>&1

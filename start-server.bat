@echo off
chcp 65001 >nul
echo ==========================================
echo  量化回测系统 - 本地HTTP服务器
echo ==========================================
echo.
echo 正在启动服务器，请稍候...
echo 启动后请用浏览器打开: http://localhost:8080
echo 按 Ctrl+C 停止服务器
echo.
cd /d "%~dp0"
python -m http.server 8080

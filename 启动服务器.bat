@echo off
chcp 65001 >nul
echo ==========
echo  量化回测系统 - 启动服务器
echo ==========
echo.

:: 杀掉之前可能运行的python服务器
taskkill /F /IM python.exe >nul 2>&1

:: 切换到脚本所在目录（stock-backtest）
cd /d "%~dp0"

:: 启动HTTP服务器（后台）
start "StockBacktestServer" /MIN python -m http.server 8888

:: 等待服务器启动
timeout /t 2 >nul

:: 自动打开浏览器
start "" "http://localhost:8888/"

echo 服务器已启动，浏览器已打开
echo 如果浏览器未自动打开，请手动访问：http://localhost:8888/
echo.
pause

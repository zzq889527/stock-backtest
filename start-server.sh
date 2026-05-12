#!/bin/bash
# 停止已有Python服务器
kill $(ps aux | grep 'http.server' | grep -v grep | awk '{print $1}') 2>/dev/null
sleep 1

# 切换到正确目录并启动服务器
cd /e/WorkBuddy/stock-backtest
python -m http.server 8888 &
sleep 2

# 验证
echo "=== 验证服务器 ==="
echo -n "根目录: "; curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8888/
echo ""
echo -n "JSON数据: "; curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8888/data/kline/sh600519.json
echo ""
echo "=== 完成，访问 http://localhost:8888/ ==="

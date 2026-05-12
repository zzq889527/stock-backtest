import json
import os

with open('data/kline/sh600519.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('embedded-data.js', 'w', encoding='utf-8') as f:
    f.write('// 内嵌K线数据，用于file://协议绕过CORS\n')
    f.write('window.EMBEDDED_KLINE_DATA = ')
    json.dump({'sh600519': data}, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')

size = os.path.getsize('embedded-data.js')
print(f'已生成 embedded-data.js ({size/1024:.1f} KB)')
print(f'数据条数: {len(data)}')
print(f'价格范围: {data[0]["close"]} ~ {data[-1]["close"]}')

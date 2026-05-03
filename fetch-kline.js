/**
 * K线数据抓取脚本
 * 用法：node fetch-kline.js <股票代码> [天数]
 * 示例：node fetch-kline.js sh600519 300
 * 输出：data/kline/sh600519.json
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const code = process.argv[2] || 'sh600519';
const datalen = parseInt(process.argv[3]) || 300;
const scale = '240'; // 240 = 日K

const url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${code}&scale=${scale}&ma=no&datalen=${datalen}`;

console.log(`正在抓取 ${code} 的K线数据...`);

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const raw = JSON.parse(data);
      if (!Array.isArray(raw) || raw.length === 0) {
        console.error('数据为空或格式错误');
        return;
      }

      // 转换为Lightweight Charts格式
      const kline = raw.map(item => ({
        time:   item.day,
        open:   parseFloat(item.open),
        high:   parseFloat(item.high),
        low:    parseFloat(item.low),
        close:  parseFloat(item.close),
        volume: parseInt(item.volume) || 0,
      }));

      const dir = path.join(__dirname, 'data', 'kline');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const outPath = path.join(dir, `${code}.json`);
      fs.writeFileSync(outPath, JSON.stringify(kline, null, 2));
      console.log(`✅ 已生成 ${kline.length} 根K线 -> ${outPath}`);
    } catch(e) {
      console.error('解析失败:', e.message);
      console.log('原始数据:', data.slice(0, 200));
    }
  });
}).on('error', e => {
  console.error('请求失败:', e.message);
});

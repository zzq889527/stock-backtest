/**
 * K线数据抓取脚本（增强版）
 * 用法：node fetch-kline.js <股票代码> [天数]
 * 示例：node fetch-kline.js sh600519 800
 * 输出：data/kline/sh600519.json
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const code = process.argv[2] || 'sh600519';
const datalen = parseInt(process.argv[3]) || 800;
const scale = '240'; // 240 = 日K

// 尝试多次请求以获取更早的数据（Sina API每次最多返回约800条）
async function fetchAllData() {
  console.log(`正在抓取 ${code} 的K线数据... (请求 ${datalen} 条)`);

  const url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${code}&scale=${scale}&ma=no&datalen=${datalen}`;

  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const raw = JSON.parse(data);
          if (!Array.isArray(raw) || raw.length === 0) {
            console.error('数据为空或格式错误');
            reject(new Error('空数据'));
            return;
          }

          // 转换为Lightweight Charts格式
          let kline = raw.map(item => ({
            time:   item.day,
            open:   parseFloat(item.open),
            high:   parseFloat(item.high),
            low:    parseFloat(item.low),
            close:  parseFloat(item.close),
            volume: parseInt(item.volume) || 0,
          }));

          // 按时间升序排列
          kline.sort((a, b) => a.time.localeCompare(b.time));

          console.log(`✅ 获取到 ${kline.length} 根K线`);
          console.log(`   时间范围: ${kline[0]?.time} ~ ${kline[kline.length-1]?.time}`);

          resolve(kline);
        } catch(e) {
          console.error('解析失败:', e.message);
          console.log('原始数据片段:', data.slice(0, 200));
          reject(e);
        }
      });
    }).on('error', e => {
      console.error('请求失败:', e.message);
      reject(e);
    });
  });
}

fetchAllData().then(kline => {
  const dir = path.join(__dirname, 'data', 'kline');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const outPath = path.join(dir, `${code}.json`);
  fs.writeFileSync(outPath, JSON.stringify(kline, null, 2));
  console.log(`✅ 已生成 ${kline.length} 根K线 -> ${outPath}`);
}).catch(e => {
  console.error('❌ 数据抓取失败:', e.message);
  process.exit(1);
});

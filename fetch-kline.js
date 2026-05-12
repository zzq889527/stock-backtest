/**
 * K线数据抓取脚本（东方财富API版）
 * 支持获取完整历史数据（通过end参数分页）
 * 用法：node fetch-kline.js <股票代码> [目标条数]
 * 示例：node fetch-kline.js sh600519 5000
 * 输出：data/kline/<代码>.json
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const code = process.argv[2] || 'sh600519';
const targetCount = parseInt(process.argv[3]) || 5000;

// 解析股票代码为东财格式
function parseCode(code) {
  const m = code.match(/^(sh|sz)(\d{6})$/);
  if (!m) throw new Error('股票代码格式错误，应为 sh600519 或 sz000001');
  return {
    market: m[1] === 'sh' ? '1' : '0', // 1=沪市, 0=深市
    num: m[2],
  };
}

const { market, num } = parseCode(code);

// 请求单页数据 (东财API每次最大约1000条)
function fetchPage(endDate = '20500101', limit = 1000) {
  // 东财K线API
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${market}.${num}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=0&end=${endDate}&lmt=${limit}`;

  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.data || !json.data.klines) {
            reject(new Error('返回格式错误或无数据'));
            return;
          }
          resolve(json.data.klines);
        } catch(e) {
          reject(new Error('解析失败: ' + e.message));
        }
      });
    }).on('error', e => reject(e));
  });
}

// 获取完整历史数据（分页）
async function fetchAllData() {
  console.log(`正在抓取 ${code} 的K线数据... (目标 ${targetCount} 条)`);

  const allData = [];
  let endDate = '20500101'; // 从最新开始
  let pageCount = 0;
  const maxPages = Math.ceil(targetCount / 1000) + 2;

  while (pageCount < maxPages) {
    pageCount++;
    try {
      const klines = await fetchPage(endDate, 1000);

      if (klines.length === 0) {
        console.log(`  第${pageCount}页: 无更多数据`);
        break;
      }

      // 东财格式: "日期,开盘,收盘,最高,最低,成交量,成交额,振幅,涨跌幅,涨跌额,换手率"
      const mapped = klines.map(line => {
        const parts = line.split(',');
        return {
          time: parts[0],                    // 日期 YYYY-MM-DD
          open: parseFloat(parts[1]),        // 开盘
          close: parseFloat(parts[2]),       // 收盘
          high: parseFloat(parts[3]),        // 最高
          low: parseFloat(parts[4]),         // 最低
          volume: parseInt(parts[5]) || 0,   // 成交量（手）
        };
      });

      // 按时间升序排列
      mapped.sort((a, b) => a.time.localeCompare(b.time));

      // 记录最早日期用于下一页请求
      const earliestDate = mapped[0].time;
      const earliestDateNum = earliestDate.replace(/-/g, '');

      // 合并到总数据（去重）
      let newCount = 0;
      for (const item of mapped) {
        if (!allData.find(d => d.time === item.time)) {
          allData.push(item);
          newCount++;
        }
      }

      console.log(`  第${pageCount}页: ${klines.length}条, 范围 ${mapped[0].time}~${mapped[mapped.length-1].time}, 新增 ${newCount}条, 累计 ${allData.length}条`);

      // 如果已经获取足够数据，或这一页数据量不足（已到开头），则停止
      if (allData.length >= targetCount || klines.length < 900) {
        if (klines.length < 900) {
          console.log(`  数据已到头（仅返回 ${klines.length} 条）`);
        }
        break;
      }

      // 设置下一页的end参数（获取比当前最早日期更早的数据）
      endDate = earliestDateNum;

      // 延迟避免请求过快
      await new Promise(r => setTimeout(r, 300));

    } catch(e) {
      console.error(`  第${pageCount}页请求失败:`, e.message);
      break;
    }
  }

  // 最终排序
  allData.sort((a, b) => a.time.localeCompare(b.time));

  console.log(`\n✅ 共获取 ${allData.length} 根K线`);
  console.log(`   时间范围: ${allData[0]?.time} ~ ${allData[allData.length-1]?.time}`);

  return allData;
}

fetchAllData().then(kline => {
  const dir = path.join(__dirname, 'data', 'kline');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const outPath = path.join(dir, `${code}.json`);
  fs.writeFileSync(outPath, JSON.stringify(kline, null, 2));
  console.log(`✅ 已保存 -> ${outPath}`);
}).catch(e => {
  console.error('❌ 数据抓取失败:', e.message);
  process.exit(1);
});

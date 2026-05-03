/**
 * 技术指标计算模块
 * 支持：MA、MACD、RSI、KDJ、BOLL
 * 兼容两种输入：K线对象数组 [{close:10.5,...}] 或 纯数字数组 [10.5,...]
 * 全局导出：window.Indicators
 */

// 判断输入类型：数字数组 vs K线对象数组
function isNumberArray(data) {
  if (!data || data.length === 0) return true;
  return typeof data[0] === 'number';
}

// ========== EMA ==========
function calcEMA(data, period) {
  const result = [];
  const k = 2 / (period + 1);
  const nums = isNumberArray(data) ? data : data.map(d => d.close);
  let ema = nums[0];
  for (let i = 0; i < nums.length; i++) {
    if (i === 0) {
      result.push(nums[0]);
    } else {
      ema = nums[i] * k + ema * (1 - k);
      result.push(ema);
    }
  }
  return result;
}

// ========== 移动平均线 (MA / SMA) ==========
function calcMA(data, period) {
  const result = [];
  const nums = isNumberArray(data) ? data : data.map(d => d.close);
  for (let i = 0; i < nums.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += nums[j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

// ========== MACD ==========
function calcMACD(data, fast = 12, slow = 26, signal = 9) {
  const nums = isNumberArray(data) ? data : data.map(d => d.close);
  const emaFast = calcEMA(nums, fast);
  const emaSlow = calcEMA(nums, slow);
  const dif = emaFast.map((val, idx) => val - emaSlow[idx]);
  const dea = calcEMA(dif, signal);
  const macd = dif.map((val, idx) => (val - dea[idx]) * 2);
  return { dif, dea, macd };
}

// ========== RSI ==========
function calcRSI(data, period = 14) {
  const result = [];
  const nums = isNumberArray(data) ? data : data.map(d => d.close);
  for (let i = 0; i < nums.length; i++) {
    if (i < period) {
      result.push(null);
      continue;
    }
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const change = nums[j] - nums[j - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}

// ========== KDJ ==========
function calcKDJ(data, period = 9, m = 3) {
  const k = [], d = [], j = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      k.push(null);
      d.push(null);
      j.push(null);
      continue;
    }
    let maxH = -Infinity, minL = Infinity;
    for (let j2 = i - period + 1; j2 <= i; j2++) {
      const bar = data[j2];
      const h = typeof bar === 'number' ? bar : bar.high;
      const l = typeof bar === 'number' ? bar : bar.low;
      const c = typeof bar === 'number' ? bar : bar.close;
      if (h > maxH) maxH = h;
      if (l < minL) minL = l;
    }
    const c = typeof data[i] === 'number' ? data[i] : data[i].close;
    const rsv = minL === maxH ? 50 : (c - minL) / (maxH - minL) * 100;
    const kPrev = k[i - 1] != null ? k[i - 1] : 50;
    const dPrev = d[i - 1] != null ? d[i - 1] : 50;
    const kVal = kPrev * (m - 1) / (m + 2) + rsv * 3 / (m + 2);
    const dVal = dPrev * (m - 1) / (m + 2) + kVal * 3 / (m + 2);
    const jVal = 3 * kVal - 2 * dVal;
    k.push(kVal);
    d.push(dVal);
    j.push(jVal);
  }
  return { k, d, j };
}

// ========== 布林带 (BOLL) ==========
function calcBOLL(data, period = 20, multiplier = 2) {
  const nums = isNumberArray(data) ? data : data.map(d => d.close);
  const mid = calcMA(nums, period);
  const upper = [], lower = [];
  for (let i = 0; i < nums.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += Math.pow(nums[j] - mid[i], 2);
      }
      const stdDev = Math.sqrt(sum / period);
      upper.push(mid[i] + multiplier * stdDev);
      lower.push(mid[i] - multiplier * stdDev);
    }
  }
  return { mid, upper, lower };
}

// ========== 计算所有指标（对象数组输入时使用） ==========
function calcAllIndicators(data) {
  return {
    ma5:  calcMA(data, 5),
    ma10: calcMA(data, 10),
    ma20: calcMA(data, 20),
    ma60: calcMA(data, 60),
    macd: calcMACD(data),
    rsi:  calcRSI(data, 14),
    kdj:  calcKDJ(data, 9, 3),
    boll: calcBOLL(data, 20, 2)
  };
}

// ========== 全局导出 ==========
// js/app.js 通过 Indicators.SMA / Indicators.MACD 等方式调用
if (typeof window !== 'undefined') {
  window.Indicators = {
    // 别名映射，兼容 app.js 的调用方式
    SMA:   calcMA,
    MACD:  calcMACD,
    RSI:   calcRSI,
    KDJ:   calcKDJ,
    BOLL:  calcBOLL,
    // 也保留原名
    calcMA,
    calcMACD,
    calcRSI,
    calcKDJ,
    calcBOLL,
    calcAllIndicators,
  };
}

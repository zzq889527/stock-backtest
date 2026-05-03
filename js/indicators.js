/**
 * 技术指标计算模块
 * 支持：MA、MACD、RSI、KDJ、BOLL
 */

// ========== 移动平均线 (MA) ==========
function calcMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j].close;
      }
      result.push(sum / period);
    }
  }
  return result;
}

// ========== MACD ==========
function calcMACD(data, fast = 12, slow = 26, signal = 9) {
  const closes = data.map(d => d.close);
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);
  const dif = emaFast.map((val, idx) => val - emaSlow[idx]);
  const dea = calcEMA(dif, signal);
  const macd = dif.map((val, idx) => (val - dea[idx]) * 2);
  
  return { dif, dea, macd };
}

function calcEMA(data, period) {
  const result = [];
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(data[0]);
    } else {
      ema = data[i] * k + ema * (1 - k);
      result.push(ema);
    }
  }
  return result;
}

// ========== RSI ==========
function calcRSI(data, period = 14) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(null);
      continue;
    }
    
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const change = data[j].close - data[j - 1].close;
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
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
      if (data[j2].high > maxH) maxH = data[j2].high;
      if (data[j2].low < minL) minL = data[j2].low;
    }
    
    const rsv = (data[i].close - minL) / (maxH - minL) * 100;
    const kVal = (k[i - 1] || 50) * (m - 1) / (m + 1) + rsv * 2 / (m + 1);
    const dVal = (d[i - 1] || 50) * (m - 1) / (m + 1) + kVal * 2 / (m + 1);
    const jVal = 3 * kVal - 2 * dVal;
    
    k.push(kVal);
    d.push(dVal);
    j.push(jVal);
  }
  
  return { k, d, j };
}

// ========== 布林带 (BOLL) ==========
function calcBOLL(data, period = 20, multiplier = 2) {
  const mid = calcMA(data, period);
  const upper = [], lower = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += Math.pow(data[j].close - mid[i], 2);
      }
      const stdDev = Math.sqrt(sum / period);
      upper.push(mid[i] + multiplier * stdDev);
      lower.push(mid[i] - multiplier * stdDev);
    }
  }
  
  return { mid, upper, lower };
}

// ========== 计算所有指标 ==========
function calcAllIndicators(data) {
  return {
    ma5: calcMA(data, 5),
    ma10: calcMA(data, 10),
    ma20: calcMA(data, 20),
    ma60: calcMA(data, 60),
    macd: calcMACD(data),
    rsi: calcRSI(data, 14),
    kdj: calcKDJ(data, 9, 3),
    boll: calcBOLL(data, 20, 2)
  };
}

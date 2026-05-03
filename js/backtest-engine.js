/**
 * 前端回测引擎
 * 纯JavaScript实现，在浏览器中运行
 */
class BacktestEngine {
  constructor() {
    this.trades = [];       // 交易记录
    this.equityCurve = [];  // 资金曲线
    this.positions = [];    // 持仓记录
  }

  /**
   * 运行回测
   * @param {Object[]} klineData - K线数据 [{time,open,high,low,close,volume}]
   * @param {Function} strategyFn - 策略函数 (ctx, idx) => 'buy'|'sell'|'hold'
   * @param {Object} options - 配置 { capital:初始资金, commission:手续费率, slippage:滑点 }
   * @returns {Object} 回测结果
   */
  run(klineData, strategyFn, options = {}) {
    const capital = options.capital || 100000;
    const commission = options.commission || 0.0003; // 万三
    const slippage = options.slippage || 0.001;      // 千一

    let cash = capital;
    let shares = 0;
    let position = 0;  // 0=空仓, 1=持仓
    let buyPrice = 0;
    this.trades = [];
    this.equityCurve = [];

    // 策略上下文
    const ctx = {
      data: klineData,
      closes: klineData.map(d => d.close),
      highs: klineData.map(d => d.high),
      lows: klineData.map(d => d.low),
      volumes: klineData.map(d => d.volume),
      Indicators: typeof Indicators !== 'undefined' ? Indicators : null
    };

    for (let i = 0; i < klineData.length; i++) {
      const bar = klineData[i];
      const signal = strategyFn(ctx, i);

      if (signal === 'buy' && position === 0) {
        // 买入
        const price = bar.close * (1 + slippage);
        const maxShares = Math.floor(cash / price); // 回测模拟，不强制整手
        if (maxShares > 0) {
          const cost = maxShares * price * (1 + commission);
          cash -= cost;
          shares = maxShares;
          position = 1;
          buyPrice = price;
          this.trades.push({
            type: 'buy',
            time: bar.time,
            price: price.toFixed(2),
            shares: maxShares,
            cost: cost.toFixed(2)
          });
        }
      } else if (signal === 'sell' && position === 1) {
        // 卖出
        const price = bar.close * (1 - slippage);
        const revenue = shares * price * (1 - commission);
        cash += revenue;
        const profit = (price - buyPrice) * shares;
        this.trades.push({
          type: 'sell',
          time: bar.time,
          price: price.toFixed(2),
          shares: shares,
          revenue: revenue.toFixed(2),
          profit: profit.toFixed(2),
          profitPct: ((price / buyPrice - 1) * 100).toFixed(2) + '%'
        });
        position = 0;
        shares = 0;
        buyPrice = 0;
      }

      // 记录每日资金
      const equity = cash + shares * bar.close;
      this.equityCurve.push({
        time: bar.time,
        value: parseFloat(equity.toFixed(2))
      });
    }

    return this.calculateMetrics(capital);
  }

  /**
   * 计算绩效指标
   */
  calculateMetrics(initialCapital) {
    const curve = this.equityCurve;
    if (curve.length === 0) return null;

    const finalEquity = curve[curve.length - 1].value;
    const totalReturn = (finalEquity / initialCapital - 1) * 100;

    // 年化收益
    const days = curve.length;
    const years = days / 252;
    const annualReturn = (Math.pow(finalEquity / initialCapital, 1 / years) - 1) * 100;

    // 最大回撤
    let maxDrawdown = 0;
    let peak = curve[0].value;
    for (const point of curve) {
      if (point.value > peak) peak = point.value;
      const dd = (peak - point.value) / peak * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // 夏普比率（假设无风险利率3%）
    const dailyReturns = [];
    for (let i = 1; i < curve.length; i++) {
      dailyReturns.push((curve[i].value / curve[i - 1].value) - 1);
    }
    const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const stdReturn = Math.sqrt(
      dailyReturns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / dailyReturns.length
    );
    const sharpe = stdReturn === 0 ? 0 : (avgReturn - 0.03 / 252) / stdReturn * Math.sqrt(252);

    // 交易统计
    const sellTrades = this.trades.filter(t => t.type === 'sell');
    const winTrades = sellTrades.filter(t => parseFloat(t.profit) > 0);
    const winRate = sellTrades.length > 0 ? (winTrades.length / sellTrades.length) * 100 : 0;

    return {
      totalReturn,
      annualReturn,
      maxDrawdown,
      sharpe,
      trades: sellTrades.length,
      winRate,
      finalEquity: finalEquity.toFixed(2),
      equityCurve: this.equityCurve,
      tradeList: this.trades
    };
  }
}

// ============ 内置策略 ============

/**
 * 双均线策略
 * @param {number} shortPeriod - 短周期
 * @param {number} longPeriod - 长周期
 * @returns {Function} 策略函数
 */
function dualMAStrategy(shortPeriod = 5, longPeriod = 20) {
  let prevShort = null, prevLong = null;
  return function(ctx, idx) {
    if (idx < longPeriod) return 'hold';
    const closes = ctx.closes;
    // 计算当前和前一根的MA
    let sumShort = 0, sumLong = 0;
    let sumShortPrev = 0, sumLongPrev = 0;
    for (let j = idx - shortPeriod + 1; j <= idx; j++) sumShort += closes[j];
    for (let j = idx - longPeriod + 1; j <= idx; j++) sumLong += closes[j];
    for (let j = idx - shortPeriod; j < idx; j++) sumShortPrev += closes[j];
    for (let j = idx - longPeriod; j < idx; j++) sumLongPrev += closes[j];

    const curShort = sumShort / shortPeriod;
    const curLong = sumLong / longPeriod;
    const preShort = sumShortPrev / shortPeriod;
    const preLong = sumLongPrev / longPeriod;

    // 金叉买入
    if (preShort <= preLong && curShort > curLong) return 'buy';
    // 死叉卖出
    if (preShort >= preLong && curShort < curLong) return 'sell';
    return 'hold';
  };
}

/**
 * MACD 策略
 * DIF 上穿 DEA 买入，下穿卖出
 */
function macdStrategy(fast = 12, slow = 26, signal = 9) {
  return function(ctx, idx) {
    if (idx < slow + signal) return 'hold';
    // 需要历史数据来计算MACD，这里用简化方式
    const Indicators = ctx.Indicators;
    if (!Indicators) return 'hold';

    const sliceCloses = ctx.closes.slice(0, idx + 1);
    const { dif, dea } = Indicators.MACD(sliceCloses, fast, slow, signal);

    const curDif = dif[dif.length - 1];
    const curDea = dea[dea.length - 1];
    const preDif = dif[dif.length - 2];
    const preDea = dea[dea.length - 2];

    if (preDif !== null && preDea !== null) {
      if (preDif <= preDea && curDif > curDea) return 'buy';
      if (preDif >= preDea && curDif < curDea) return 'sell';
    }
    return 'hold';
  };
}

if (typeof window !== 'undefined') {
  window.BacktestEngine = BacktestEngine;
  window.dualMAStrategy = dualMAStrategy;
  window.macdStrategy = macdStrategy;
}

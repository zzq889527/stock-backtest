/**
 * 主应用逻辑 - app.js
 * 依赖: lightweight-charts, Vue3, Indicators, BacktestEngine
 */
const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

createApp({
  setup() {
    // =========== 状态 ===========
    const stockCode = ref('sh600000');
    const activeMainTab = ref('chart');
    const quote = ref(null);
    const period = ref('daily');
    const chartHeight = ref(450);

    // 指标开关
    const indicators = ref([
      { key:'ma5',  label:'MA5',  on:true },
      { key:'ma10', label:'MA10', on:true },
      { key:'ma20', label:'MA20', on:true },
      { key:'macd', label:'MACD', on:false },
      { key:'rsi',  label:'RSI',  on:false },
      { key:'boll', label:'BOLL', on:false },
    ]);

    const periods = [
      { v:'daily',  l:'日K' },
      { v:'weekly', l:'周K' },
      { v:'monthly',l:'月K' },
    ];

    const mainTabs = [
      { key:'chart',      label:'K线图' },
      { key:'backtest',   label:'回测' },
      { key:'fundamental',label:'基本面' },
    ];

    // 回测
    const btStrategy = ref('dualMA');
    const btCapital = ref(100000);
    const btParam = ref({ short:5, long:20 });
    const btResult = ref(null);

    // 基本面
    const fundamentalList = ref([
      { key:'pe',     label:'PE(TTM)',   value:'--', percentile:null },
      { key:'pb',     label:'PB',        value:'--', percentile:null },
      { key:'roe',    label:'ROE',       value:'--', percentile:null },
      { key:'dy',     label:'股息率',    value:'--', percentile:null },
    ]);
    const activeFund = ref(null);

    // 图表实例
    let chart = null;
    let candleSeries = null;
    let volumeSeries = null;
    let ma5Series = null, ma10Series = null, ma20Series = null;
    let bollUpper = null, bollMiddle = null, bollLower = null;
    let macdHist = null, macdDif = null, macdDea = null;
    let rsiSeries = null;
    let equityChart = null;
    let fundChart = null;

    // =========== K线数据生成 ===========
    function generateKline(days = 200) {
      const data = [];
      let price = 10.0;
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - days);
      for (let i = 0; i < days; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        const o = price;
        const c = o + (Math.random() - 0.48) * 0.5;
        const h = Math.max(o, c) + Math.random() * 0.3;
        const l = Math.min(o, c) - Math.random() * 0.3;
        const v = Math.floor(Math.random() * 5000000 + 1000000);
        data.push({
          time:  d.toISOString().slice(0,10),
          open:  parseFloat(o.toFixed(2)),
          high:  parseFloat(h.toFixed(2)),
          low:   parseFloat(l.toFixed(2)),
          close: parseFloat(c.toFixed(2)),
          volume:v,
        });
        price = c;
      }
      return data;
    }

    let klineData = [];

    // =========== 初始化图表 ===========
    function initChart() {
      const el = document.getElementById('kline-chart');
      if (!el) return;
      if (chart) { try { chart.remove(); } catch(e){} }

      const isMobile = window.innerWidth < 768;
      chartHeight.value = isMobile ? 350 : 450;

      chart = LightweightCharts.createChart(el, {
        width: el.clientWidth,
        height: chartHeight.value,
        layout: {
          background: { type:'solid', color:'#ffffff' },
          textColor: '#333',
          fontSize: 11,
        },
        grid: {
          vertLines: { color:'#f0f0f0' },
          horzLines: { color:'#f0f0f0' },
        },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        rightPriceScale: { borderColor:'#e0e0e0' },
        timeScale: {
          borderColor:'#e0e0e0',
          timeVisible: false,
          secondsVisible: false,
        },
      });

      // K线
      candleSeries = chart.addCandlestickSeries({
        upColor:'#ef5350', downColor:'#26a69a',
        borderVisible:false,
        wickUpColor:'#ef5350', wickDownColor:'#26a69a',
      });

      // 成交量
      volumeSeries = chart.addHistogramSeries({
        priceFormat: { type:'volume' },
        priceScaleId: '',
        scaleMargins: { top:0.8, bottom:0 },
      });

      chart.timeScale().fitContent();

      window.addEventListener('resize', () => {
        chart.applyOptions({ width: el.clientWidth });
      });
    }

    // =========== 渲染图表 ===========
    function renderChart() {
      if (!candleSeries) initChart();
      if (klineData.length === 0) {
        klineData = generateKline(200);
      }

      candleSeries.setData(klineData.map(d => ({
        time:d.time, open:d.open, high:d.high, low:d.low, close:d.close
      })));

      volumeSeries.setData(klineData.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(239,83,80,0.3)' : 'rgba(38,166,154,0.3)'
      })));

      // 计算并渲染指标
      const closes = klineData.map(d => d.close);
      const highs  = klineData.map(d => d.high);
      const lows   = klineData.map(d => d.low);

      // MA
      renderMA(closes);
      // MACD
      if (indicators.value.find(i=>i.key==='macd'&&i.on)) {
        renderMACD(closes);
      }
      // RSI
      if (indicators.value.find(i=>i.key==='rsi'&&i.on)) {
        renderRSI(closes);
      }
      // BOLL
      if (indicators.value.find(i=>i.key==='boll'&&i.on)) {
        renderBOLL(closes);
      }

      chart.timeScale().fitContent();
    }

    function renderMA(closes) {
      const ind = Indicators;
      const ma5 = ind.SMA(closes, 5);
      const ma10 = ind.SMA(closes, 10);
      const ma20 = ind.SMA(closes, 20);

      if (!ma5Series) {
        ma5Series  = chart.addLineSeries({ color:'#f6c000', lineWidth:1, priceLineVisible:false, lastValueVisible:false });
        ma10Series = chart.addLineSeries({ color:'#e040fb', lineWidth:1, priceLineVisible:false, lastValueVisible:false });
        ma20Series = chart.addLineSeries({ color:'#00bcd4', lineWidth:1, priceLineVisible:false, lastValueVisible:false });
      }
      const data = klineData.map((d,i) => ({time:d.time}));
      ma5Series.setData(klineData.map((d,i) => ({time:d.time, value:ma5[i]})));
      ma10Series.setData(klineData.map((d,i) => ({time:d.time, value:ma10[i]})));
      ma20Series.setData(klineData.map((d,i) => ({time:d.time, value:ma20[i]})));

      // 显隐
      ma5Series.applyOptions({ visible: indicators.value.find(i=>i.key==='ma5').on });
      ma10Series.applyOptions({ visible: indicators.value.find(i=>i.key==='ma10').on });
      ma20Series.applyOptions({ visible: indicators.value.find(i=>i.key==='ma20').on });
    }

    function renderMACD(closes) {
      if (!macdHist) {
        macdHist = chart.addHistogramSeries({
          priceScaleId: 'macd',
          scaleMargins: { top:0.7, bottom:0 },
        });
        macdDif = chart.addLineSeries({ priceScaleId:'macd', color:'#f6c000', lineWidth:1, lastValueVisible:false, priceLineVisible:false });
        macdDea = chart.addLineSeries({ priceScaleId:'macd', color:'#e040fb', lineWidth:1, lastValueVisible:false, priceLineVisible:false });
        chart.priceScale('macd').applyOptions({ scaleMargins:{top:0.7,bottom:0} });
      }
      const { dif, dea, macd } = Indicators.MACD(closes, 12, 26, 9);
      macdHist.setData(klineData.map((d,i) => ({
        time:d.time, value:macd[i],
        color: macd[i]>=0 ? 'rgba(239,83,80,0.5)' : 'rgba(38,166,154,0.5)'
      })));
      macdDif.setData(klineData.map((d,i) => ({time:d.time, value:dif[i]})));
      macdDea.setData(klineData.map((d,i) => ({time:d.time, value:dea[i]})));
    }

    function renderRSI(closes) {
      if (!rsiSeries) {
        rsiSeries = chart.addLineSeries({
          priceScaleId: 'rsi',
          color:'#ff9800', lineWidth:1,
          lastValueVisible:false, priceLineVisible:false,
        });
        chart.priceScale('rsi').applyOptions({ scaleMargins:{top:0.05,bottom:0.05} });
      }
      const rsi = Indicators.RSI(closes, 14);
      rsiSeries.setData(klineData.map((d,i) => ({time:d.time, value:rsi[i]})));
    }

    function renderBOLL(closes) {
      if (!bollUpper) {
        bollUpper  = chart.addLineSeries({ color:'#9c27b0', lineWidth:1, lastValueVisible:false, priceLineVisible:false });
        bollMiddle = chart.addLineSeries({ color:'#2196f3', lineWidth:1, lastValueVisible:false, priceLineVisible:false });
        bollLower  = chart.addLineSeries({ color:'#9c27b0', lineWidth:1, lastValueVisible:false, priceLineVisible:false });
      }
      const { upper, middle, lower } = Indicators.BOLL(closes, 20, 2);
      bollUpper.setData(klineData.map((d,i) => ({time:d.time, value:upper[i]})));
      bollMiddle.setData(klineData.map((d,i) => ({time:d.time, value:middle[i]})));
      bollLower.setData(klineData.map((d,i) => ({time:d.time, value:lower[i]})));
    }

    // =========== 切换指标 ===========
    function toggleIndicator(key) {
      const item = indicators.value.find(i => i.key === key);
      if (item) { item.on = !item.on; }
      renderChart();
    }

    // =========== 获取实时行情 ===========
    async function loadStock() {
      const code = stockCode.value.trim();
      if (!code) return;

      try {
        // 尝试新浪财经API（可能有跨域问题）
        const resp = await fetch(`https://hq.sinajs.cn/list=${code}`);
        const text = await resp.text();
        const m = text.match(/="(.+)";/);
        if (m && m[1]) {
          const p = m[1].split(',');
          if (p.length > 30) {
            const close = parseFloat(p[2]);
            const cur  = parseFloat(p[3]);
            quote.value = {
              name: p[0],
              price: cur.toFixed(2),
              change: (cur - close).toFixed(2),
              pct: ((cur-close)/close*100).toFixed(2),
              vol: parseInt(p[8]),
              amt: parseFloat(p[9]),
              time: p[31] || '--',
            };
          }
        }
      } catch(e) {
        // 跨域失败，使用模拟数据
        quote.value = {
          name: '浦发银行(示例)',
          price: '10.50',
          change: '0.25',
          pct: '2.44',
          vol: 12500000,
          amt: 131250000,
          time: new Date().toLocaleTimeString(),
        };
      }

      // 生成K线数据
      klineData = generateKline(200);
      renderChart();
    }

    // =========== 回测 ===========
    function runBacktest() {
      if (klineData.length === 0) {
        alert('请先加载股票数据！');
        return;
      }

      let strategyFn;
      if (btStrategy.value === 'dualMA') {
        strategyFn = dualMAStrategy(btParam.value.short, btParam.value.long);
      } else {
        strategyFn = macdStrategy();
      }

      const engine = new BacktestEngine();
      const result = engine.run(klineData, strategyFn, {
        capital: btCapital.value,
        commission: 0.0003,
        slippage: 0.001,
      });

      btResult.value = result;

      // 渲染资金曲线
      nextTick(() => {
        const el = document.getElementById('equity-chart');
        if (!el) return;
        if (equityChart) equityChart.remove();
        equityChart = LightweightCharts.createChart(el, {
          width: el.clientWidth, height: 250,
          layout:{background:{type:'solid',color:'#fff'},textColor:'#333'},
          grid:{vertLines:{color:'#f0f0f0'},horzLines:{color:'#f0f0f0'}},
        });
        const s = equityChart.addLineSeries({ color:'#2563eb', lineWidth:2 });
        s.setData(result.equityCurve);
        equityChart.timeScale().fitContent();
      });
    }

    // =========== 基本面 ===========
    function showFundamental(key) {
      console.log('showFundamental called:', key);
      activeFund.value = key;
      // 模拟历史数据（24个月）
      const history = [];
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() - 24);
      let val = key==='pe'?15:key==='pb'?1.5:key==='roe'?10:key==='dy'?2:50;
      for (let i = 0; i < 24; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        val += (Math.random()-0.5)*2;
        history.push({ time: d.toISOString().slice(0,7), value: parseFloat(val.toFixed(2)) });
      }

      // 计算分位值
      const values = history.map(h => h.value);
      const current = values[values.length - 1];
      const sorted = [...values].sort((a,b) => a - b);
      const rank = sorted.indexOf(current) + 1;
      const pct = Math.round(rank / sorted.length * 100);
      const fitem = fundamentalList.value.find(f => f.key === key);
      if (fitem) { fitem.percentile = pct; }

      nextTick(() => {
        // 1. 历史趋势图
        const el = document.getElementById('fund-chart');
        if (!el) return;
        if (fundChart) { try { fundChart.remove(); } catch(e){} }
        fundChart = LightweightCharts.createChart(el, {
          width:el.clientWidth, height:300,
          layout:{background:{type:'solid',color:'#fff'},textColor:'#333'},
          grid:{vertLines:{color:'#f0f0f0'},horzLines:{color:'#f0f0f0'}},
        });
        const s = fundChart.addLineSeries({ color:'#16a34a', lineWidth:2 });
        s.setData(history);
        fundChart.timeScale().fitContent();

        // 2. 分位值条
        const barEl = document.getElementById('fund-pct-bar');
        if (barEl) {
          const color = pct <= 30 ? '#16a34a' : pct >= 70 ? '#dc2626' : '#ca8a04';
          const label = pct <= 30 ? '低估' : pct >= 70 ? '高估' : '合理';
          barEl.innerHTML = `
            <div style="font-size:13px;margin-bottom:6px;">当前分位值：<b>${pct}%</b> （${label}）</div>
            <div style="background:#eee;border-radius:8px;height:18px;overflow:hidden;position:relative;">
              <div style="background:#16a34a;width:30%;height:100%;position:absolute;left:0;"></div>
              <div style="background:#ca8a04;width:40%;height:100%;position:absolute;left:30%;"></div>
              <div style="background:#dc2626;width:30%;height:100%;position:absolute;left:70%;"></div>
              <div style="position:absolute;left:${pct}%;top:-3px;transform:translateX(-50%);font-size:20px;color:${color};">▼</div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#888;margin-top:2px;">
              <span>0%</span><span>30%（合理下限）</span><span>70%（合理上限）</span><span>100%</span>
            </div>`;
        }

        // 3. 雷达图（多指标对比）
        const canvas = document.getElementById('fund-radar');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, 300, 300);
          // 画一个简单的雷达图背景
          const cx = 150, cy = 150, r = 100;
          const keys = ['pe','pb','roe','dy'];
          const labels = ['PE','PB','ROE','股息率'];
          ctx.strokeStyle = '#ddd';
          ctx.beginPath();
          for (let i = 0; i < keys.length; i++) {
            const angle = (Math.PI * 2 * i / keys.length) - Math.PI / 2;
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle)*r, cy + Math.sin(angle)*r);
          }
          ctx.stroke();
          // 数据多边形（模拟）
          ctx.fillStyle = 'rgba(59,130,246,0.3)';
          ctx.strokeStyle = '#3b82f6';
          ctx.beginPath();
          for (let i = 0; i < keys.length; i++) {
            const angle = (Math.PI * 2 * i / keys.length) - Math.PI / 2;
            const f = fundamentalList.value.find(f => f.key === keys[i]);
            const valNorm = f && f.percentile != null ? f.percentile / 100 : 0.5;
            const x = cx + Math.cos(angle) * r * valNorm;
            const y = cy + Math.sin(angle) * r * valNorm;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          // 标签
          ctx.fillStyle = '#333';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          for (let i = 0; i < keys.length; i++) {
            const angle = (Math.PI * 2 * i / keys.length) - Math.PI / 2;
            const x = cx + Math.cos(angle) * (r + 20);
            const y = cy + Math.sin(angle) * (r + 20);
            ctx.fillText(labels[i], x, y + 4);
          }
        }
      });
    }

    // =========== 格式化 ===========
    function fmtVol(v) {
      if (!v) return '--';
      if (v >= 1e8) return (v/1e8).toFixed(2)+'亿股';
      if (v >= 1e4) return (v/1e4).toFixed(2)+'万股';
      return v+'股';
    }
    function fmtAmt(v) {
      if (!v) return '--';
      if (v >= 1e8) return (v/1e8).toFixed(2)+'亿元';
      if (v >= 1e4) return (v/1e4).toFixed(2)+'万元';
      return v+'元';
    }

    // =========== 生命周期 ===========
    onMounted(() => {
      initChart();
      klineData = generateKline(200);
      renderChart();
      // 自动加载示例行情
      quote.value = {
        name: '浦发银行(示例)',
        price: '10.50',
        change: '0.25',
        pct: '2.44',
        vol: 12500000,
        amt: 131250000,
        time: new Date().toLocaleTimeString(),
      };
      // 模拟基本面数据
      fundamentalList.value = [
        { key:'pe',  label:'PE(TTM)',  value:'15.20', percentile:45.2 },
        { key:'pb',  label:'PB',       value:'1.35',  percentile:32.1 },
        { key:'roe', label:'ROE',      value:'12.5%', percentile:58.3 },
        { key:'dy',  label:'股息率',   value:'3.2%',  percentile:68.7 },
      ];
    });

    return {
      stockCode, activeMainTab, quote, period, chartHeight,
      indicators, periods, mainTabs,
      btStrategy, btCapital, btParam, btResult,
      fundamentalList, activeFund,
      loadStock, toggleIndicator, runBacktest, showFundamental,
      fmtVol, fmtAmt,
    };
  }
}).mount('#app');

function initChart() {
  const el = document.getElementById('kline-chart');
  if (!el) { console.error('[initChart] 找不到 kline-chart 元素'); return; }
  
  try {
    if (chart) { chart.remove(); }
  } catch(e){ console.warn('[initChart] 清除旧图表失败', e); }

  try {
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

    // K线 - v5.0 API: addSeries(type, options)，type=2 表示 Candlestick
    candleSeries = chart.addSeries(2, {
      upColor:'#ef5350', downColor:'#26a69a',
      borderVisible:false,
      wickUpColor:'#ef5350', wickDownColor:'#26a69a',
    });

    // 成交量
    volumeSeries = chart.addSeries(3, {  // 3 = Histogram
      priceFormat: { type:'volume' },
      priceScaleId: '',
      scaleMargins: { top:0.8, bottom:0 },
    });

    chart.timeScale().fitContent();

    window.addEventListener('resize', () => {
      chart.applyOptions({ width: el.clientWidth });
    });
    console.log('[initChart] 图表初始化成功');
  } catch(e) {
    console.error('[initChart] 初始化失败', e);
  }
}
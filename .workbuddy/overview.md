# 回测修复 + CORS + 图表增强

## 本次完成的内容

### 1. 🔴 回测全0bug修复
**根因**：茅台~1400元/股，初始资金10万连1手（100股=14万）都买不起。`Math.floor(cash/price/100)*100` 导致永远进不了场。
**修复**：初始资金从10万→**100万**；去掉整手限制改为 `Math.floor(cash/price)`。

### 2. 🔴 CORS实时行情
**方案**：新增三层函数链 `fetchQuoteText(code)`：
- 第1层：直连 `hq.sinajs.cn`（少数环境能通）
- 第2层：`allorigins.win` CORS代理
- 第3层：K线最后价格回退（兜底）
- `loadStock` 和 `updateRealtime` 都统一用这个共享函数。

### 3. 🟡 图表增强
- **对数坐标切换**：按钮在指标栏右侧，`LightweightCharts.PriceScaleMode.Logarithmic`
- **副图面板标题**：MACD / RSI 区域显示文字标签

## 当前页面验证
- 服务运行在 `http://localhost:8080/index.html`
- 登录页点"运行回测"应该看到非零结果
- 点 MACD / RSI 按钮，副图应该显示在各自区域且有标签
- 点"对数"按钮切换坐标模式

## Git 提交
- `7687d5a` — 副图布局 + 股票名称
- `38c3de6` — 回测bug + CORS
- `407c487` — 对数坐标 + 副图标签

# 股票回测系统 UI 专业版改造计划

## 一、项目概述

将现有浅色主题的股票回测系统，改造为类似同花顺/东方财富专业版的深色金融终端风格。重点放在回测系统的专业化展示。

## 二、设计规范

### 2.1 配色方案（Dark Pro Theme）

```css
:root {
  --bg-primary: #0d1117;      /* 页面主背景 - GitHub Dark */
  --bg-secondary: #161b22;     /* 卡片/面板背景 */
  --bg-tertiary: #21262d;      /* 输入框、按钮、hover背景 */
  --bg-hover: #30363d;         /* hover状态 */
  --border-color: #30363d;     /* 边框、分割线 */
  --border-light: #21262d;     /* 浅色边框 */
  --text-primary: #c9d1d9;     /* 主文字 */
  --text-secondary: #8b949e;   /* 次要文字、标签 */
  --text-muted: #6e7681;       /* 禁用、提示文字 */
  --accent-blue: #58a6ff;      /* 强调色、主按钮、选中状态 */
  --accent-blue-hover: #79b8ff;/* 按钮hover */
  --accent-green: #3fb950;     /* 涨、成功、低估值 */
  --accent-red: #f85149;       /* 跌、危险、高估值 */
  --accent-orange: #d29922;    /* 警告、合理估值 */
  --accent-purple: #a371f7;    /* 辅助强调 */
}
```

### 2.2 图表深色主题

```javascript
// Lightweight Charts 深色配置
layout: {
  background: { type: 'solid', color: '#0d1117' },
  textColor: '#c9d1d9',
  fontSize: 11,
},
grid: {
  vertLines: { color: '#21262d' },
  horzLines: { color: '#21262d' },
},
crosshair: {
  mode: LightweightCharts.CrosshairMode.Normal,
  vertLine: { color: '#58a6ff', width: 1, style: 2 },
  horzLine: { color: '#58a6ff', width: 1, style: 2 },
},
```

### 2.3 字体与间距

- 字体：系统默认 `-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif`
- 基础字号：14px
- 小字号：12px（标签、辅助文字）
- 大字号：18px（标题、价格）
- 卡片圆角：8px
- 按钮圆角：6px
- 卡片间距：12px
- 内边距：16px（标准）/ 12px（紧凑）

## 三、布局架构

### 3.1 桌面端布局（>=1024px）

```
┌─────────────────────────────────────────────────────────────┐
│ 顶部状态栏 (48px)                                            │
│ 股票名称 · 最新价 · 涨跌幅% · 成交量 · [实时状态●]              │
├──────────┬──────────────────────────────────────────────────┤
│          │  标签栏: [K线图] [回测系统] [基本面] [设置]         │
│  左侧    │                                                   │
│  导航栏  │  ┌─────────────────────────────────────────┐      │
│  (56px)  │  │           K线主图区域                    │      │
│          │  │     (深色背景 + 成交量)                  │      │
│  📊      │  └─────────────────────────────────────────┘      │
│  🎯      │  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  📊      │  │ MACD    │ │  RSI    │ │ 成交量  │  副图区      │
│  ⚙️      │  └─────────┘ └─────────┘ └─────────┘            │
│          │                                                   │
│          │  指标按钮栏: MA5 MA10 MA20 MACD RSI BOLL 对数 基本面 │
├──────────┴──────────────────────────────────────────────────┤
│ 当切换到「回测系统」标签时：                                   │
│ ┌───────────────────────────────────────────────────────────┐│
│ │  ┌─────────┐  ┌─────────────────────┐  ┌───────────────┐  ││
│ │  │策略参数  │  │   回测结果仪表板     │  │   资金曲线图   │  ││
│ │  │(25%)    │  │      (35%)          │  │    (40%)      │  ││
│ │  │         │  │  ┌───┐┌───┐┌───┐   │  │               │  ││
│ │  │策略选择  │  │  │收益││年化││回撤│   │  │  Lightweight  │  ││
│ │  │初始资金  │  │  └───┘└───┘└───┘   │  │    Charts     │  ││
│ │  │短/长周期 │  │  ┌───┐┌───┐┌───┐   │  │   (深色主题)   │  ││
│ │  │[运行回测]│  │  │夏普││次数││胜率│   │  │               │  ││
│ │  └─────────┘  │  └───┘└───┘└───┘   │  └───────────────┘  ││
│ │               └─────────────────────┘                     ││
│ │  ┌─────────────────────────────────────────────────────┐  ││
│ │  │              交易记录表格（可滚动）                    │  ││
│ │  │  时间      类型      价格      数量      盈亏        │  ││
│ │  └─────────────────────────────────────────────────────┘  ││
│ └───────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 3.2 移动端布局（<768px）

```
┌─────────────────────────────────┐
│ 顶部状态栏（简化）                │
├─────────────────────────────────┤
│                                 │
│         K线主图区域              │
│                                 │
├─────────────────────────────────┤
│ 指标按钮栏（横向滚动）            │
├─────────────────────────────────┤
│ 底部导航栏（4个图标）             │
│  📊   🎯   📊   ⚙️              │
└─────────────────────────────────┘
```

## 四、组件详细设计

### 4.1 左侧导航栏

```css
.sidebar {
  width: 56px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
  gap: 4px;
}
.sidebar-item {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
  position: relative;
}
.sidebar-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
.sidebar-item.active {
  background: var(--accent-blue);
  color: #fff;
}
/* 选中指示条 */
.sidebar-item.active::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--accent-blue);
  border-radius: 0 2px 2px 0;
}
```

### 4.2 顶部状态栏

```css
.top-bar {
  height: 48px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
}
.stock-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.stock-code {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: 4px;
}
.price {
  font-size: 20px;
  font-weight: 700;
  font-family: 'SF Mono', monospace;
}
.price.up { color: var(--accent-red); }
.price.down { color: var(--accent-green); }
.change {
  font-size: 14px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
.change.up {
  color: var(--accent-red);
  background: rgba(248, 81, 73, 0.15);
}
.change.down {
  color: var(--accent-green);
  background: rgba(63, 185, 80, 0.15);
}
```

### 4.3 回测结果卡片

```css
.metric-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.metric-label {
  font-size: 12px;
  color: var(--text-secondary);
}
.metric-value {
  font-size: 20px;
  font-weight: 700;
  font-family: 'SF Mono', monospace;
}
.metric-value.up { color: var(--accent-red); }
.metric-value.down { color: var(--accent-green); }
```

### 4.4 交易记录表格

```css
.trade-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.trade-table th {
  text-align: left;
  padding: 8px 12px;
  color: var(--text-secondary);
  font-weight: 500;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
}
.trade-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
}
.trade-table tr:hover td {
  background: var(--bg-tertiary);
}
.badge-buy {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(248, 81, 73, 0.15);
  color: var(--accent-red);
}
.badge-sell {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(63, 185, 80, 0.15);
  color: var(--accent-green);
}
```

## 五、文件修改清单

| 文件 | 修改类型 | 修改内容 |
|------|---------|---------|
| index.html | 重写 | CSS主题、HTML结构、布局系统 |
| js/app.js | 大幅修改 | 图表深色主题、回测UI增强、响应式逻辑 |
| js/indicators.js | 不修改 | 无需改动 |
| js/backtest-engine.js | 不修改 | 无需改动 |

## 六、实现顺序

1. **Phase 1**: 重写 index.html
   - CSS Variables 定义
   - 全局深色样式
   - 左侧导航栏HTML
   - 顶部状态栏HTML
   - 主内容区布局
   - 回测面板新布局
   - 响应式媒体查询

2. **Phase 2**: 修改 js/app.js
   - 图表初始化改为深色主题
   - 回测结果渲染改为新卡片式UI
   - 交易记录表格渲染
   - 资金曲线图深色主题
   - 响应式交互（移动端导航切换）

3. **Phase 3**: 验证
   - 语法检查
   - 功能测试
   - 响应式测试

## 七、回测系统增强详情

### 7.1 策略参数面板
- 策略选择：下拉框（双均线、MACD、KDJ）
- 初始资金：数字输入框（默认100万）
- 短周期/长周期：数字输入框（条件显示）
- 手续费率：数字输入框（默认0.03%）
- 滑点：数字输入框（默认0.1%）
- 高级选项：可折叠面板

### 7.2 结果仪表板（6个指标）
1. 总收益率 - 红色(涨)/绿色(跌)
2. 年化收益率
3. 最大回撤 - 绿色（越小越好）
4. 夏普比率
5. 交易次数
6. 胜率 - 百分比

### 7.3 资金曲线图
- 深色主题
- 买入点标记（红色圆点）
- 卖出点标记（绿色圆点）
- 鼠标悬停显示具体数值

### 7.4 交易记录表
- 列：时间、类型、价格、数量、手续费、盈亏
- 买入行：红色文字
- 卖出行：绿色文字
- 最多显示50条，可滚动

## 八、响应式断点

| 断点 | 布局变化 |
|------|---------|
| >=1024px | 完整桌面布局，左侧导航展开 |
| 768-1023px | 左侧导航收缩为图标，回测面板改为上下布局 |
| <768px | 底部导航栏，单列布局，图表高度降低 |

## 九、待确认问题

1. 是否需要保留基本面独立标签页，还是整合到K线图下方？
2. 回测策略是否需要增加更多（如KDJ策略）？
3. 是否需要添加策略参数优化（网格搜索）功能？
4. 交易记录是否需要导出功能？

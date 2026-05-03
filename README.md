# 股票基金量化回测系统

纯前端实现的股票/基金量化回测系统，无需后端服务器，可直接部署在GitHub Pages。

## 功能特性

- ✅ K线图展示（日K/周K/月K）
- ✅ 实时行情查看（新浪财经API）
- 🚧 策略回测（开发中）
- 🚧 基本面数据展示（开发中）
- 🚧 组合回测（开发中）

## 技术栈

- **前端框架**: Vue 3 (CDN引入)
- **图表库**: TradingView Lightweight Charts v5.0
- **CSS框架**: Tailwind CSS (CDN引入)
- **数据来源**: 新浪财经免费API

## 快速开始

### 方法1: 直接打开（需要联网）

由于使用了CDN引入外部库，需要联网才能正常显示。

直接用浏览器打开 `index.html` 即可（建议使用本地HTTP服务器）。

### 方法2: 使用HTTP服务器

**使用Python:**
```bash
cd E:\WorkBuddy\stock-backtest
python -m http.server 8000
```

然后浏览器访问: http://localhost:8000

**使用Node.js:**
```bash
npx http-server -p 8000
```

### 方法3: 部署到GitHub Pages

1. 创建GitHub仓库
2. 推送代码到 `main` 分支
3. 在仓库设置中启用 GitHub Pages
4. 访问 `https://您的用户名.github.io/仓库名/`

## 使用说明

1. 在股票代码输入框中输入代码（例如: `sh600000` 或 `sz000001`）
2. 点击"加载数据"按钮
3. 查看K线图和实时行情
4. 点击"日K"/"周K"/"月K"切换周期（功能开发中）

## 项目结构

```
stock-backtest/
├── index.html          # 主页面
├── css/               # 样式文件
├── js/                # JavaScript文件
│   ├── app.js         # 主应用逻辑
│   ├── backtest-engine.js  # 回测引擎（待开发）
│   ├── indicators.js  # 技术指标（待开发）
│   └── data-loader.js # 数据加载（待开发）
├── data/              # 数据文件（待开发）
└── README.md          # 项目说明
```

## 开发计划

- [x] 项目基础结构
- [x] K线图展示（模拟数据）
- [x] 实时行情获取
- [ ] 真实历史K线数据加载
- [ ] 技术指标计算与展示（MA/MACD/RSI）
- [ ] 策略回测引擎
- [ ] 基本面数据可视化
- [ ] 数据更新脚本（Python + AKShare）

## 注意事项

- 本系统仅用于学习研究，不构成投资建议
- 实时行情数据来自新浪财经免费API，可能有延迟
- 历史数据需要通过Python脚本下载并生成JSON文件

## 许可证

MIT License

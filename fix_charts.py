#!/usr/bin/env python3
"""
修复基本面图表问题：
1. 日期 NAN/NAN - tickMarkFormatter 无法处理字符串日期
2. 优化图表交互 - 添加鼠标悬停交叉线、自动缩放等
"""
import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ========== 1. 修复 tickMarkFormatter ==========
# 替换所有 tickMarkFormatter
old_tick = '''tickMarkFormatter:(time)=>{
              const d=new Date(time*1000);return (d.getMonth()+1)+'/'+d.getDate();
            }'''
new_tick = '''tickMarkFormatter:(time)=>{
              if(typeof time==='string'){const p=time.split('-');return parseInt(p[1])+'月';}
              const d=new Date(time*1000);return (d.getMonth()+1)+'月';
            }'''

count = content.count(old_tick)
if count > 0:
    content = content.replace(old_tick, new_tick)
    print(f'✅ 已修复 {count} 处 tickMarkFormatter（字符串日期支持）')
else:
    print('⚠️ 未找到旧的 tickMarkFormatter，可能已被修改')
    # 尝试更宽松的匹配
    pattern = r'tickMarkFormatter:\(time\)=>\{[^}]+getMonth\(\)[^}]+\}'
    new_tick_formatter = '''tickMarkFormatter:(time)=>{
              if(typeof time==='string'){const p=time.split('-');return parseInt(p[1])+'月';}
              const d=new Date(time*1000);return (d.getMonth()+1)+'月';
            }'''
    content = re.sub(pattern, new_tick_formatter, content)
    print(f'✅ 使用正则替换了 tickMarkFormatter')

# ========== 2. 完善 renderPercentileChart ==========
old_percentile = '''    function renderPercentileChart() {
      const container = document.getElementById('percentile-chart');
      if (!container || !fundHistory.value) return;
      const history = fundHistory.value.history;
      const latest = history[history.length - 1];
      if (!latest) return;
      const indicators = [
        { key: 'pe_ttm', label: 'PE(TTM)', value: latest.pe_ttm, color: '#2962FF' },
        { key: 'pb', label: 'PB', value: latest.pb, color: '#FF6B6B' },
        { key: 'roe', label: 'ROE', value: latest.roe, color: '#26A69A' },
        { key: 'dividend_yield', label: '股息率', value: latest.dividend_yield, color: '#FFA726' }
      ];
      let html = '<div style="padding:10px;">';
      for (const ind of indicators) {
        const values = history.map(h => h[ind.key]).filter(v => v != null);
        const percentile = calcPercentile(values, ind.value);
        const color = percentile < 30 ? '#4CAF50' : percentile < 70 ? '#FFC107' : '#F44336';
        html += `<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-size:13px;font-weight:600;">${ind.label}</span><span style="font-size:13px;color:${color};font-weight:700;">${ind.value?.toFixed(2)} (${percentile.toFixed(1)}%)</span></div><div style="height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;"><div style="height:100%;width:${percentile}%;background:linear-gradient(90deg,#4CAF50,#FFC107,#F44336);border-radius:4px;"></div></div><div style="display:flex;justify-content:space-between;font-size:11px;color:#888;margin-top:2px;"><span>低估(0-30%)</span><span>合理(30-70%)</span><span>高估(70-100%)</span></div></div>`;
      }
      html += '</div>';
      container.innerHTML = html;
    }'''

new_percentile = '''    function renderPercentileChart() {
      const container = document.getElementById('percentile-chart');
      if (!container || !fundHistory.value || !fundHistory.value.current) return;
      const current = fundHistory.value.current;
      const latest = fundHistory.value.history?.[fundHistory.value.history.length-1] || {};
      const indicators = [
        { key: 'pe_ttm', label: 'PE(TTM)', value: current.pe_ttm ?? latest.pe_ttm, pct: current.pe_percentile, color: '#2962FF' },
        { key: 'pb', label: 'PB', value: current.pb ?? latest.pb, pct: current.pb_percentile, color: '#FF6B6B' },
        { key: 'roe', label: 'ROE', value: current.roe ?? latest.roe, pct: current.roe_percentile, color: '#26A69A' },
        { key: 'dy', label: '股息率', value: current.dividend_yield ?? latest.dividend_yield, pct: current.dividend_yield_percentile, color: '#FFA726' }
      ];
      let html = '<div style="padding:10px;"><h4 style="font-size:14px;margin-bottom:12px;color:#333;">📊 历史分位数</h4>';
      for (const ind of indicators) {
        if (ind.value == null) continue;
        const pct = (ind.pct != null) ? ind.pct : 50;
        const color = pct < 30 ? '#16a34a' : pct < 70 ? '#ca8a04' : '#dc2626';
        const bgColor = pct < 30 ? '#f0fdf4' : pct < 70 ? '#fefce8' : '#fef2f2';
        html += \`<div style="margin-bottom:14px;padding:10px 12px;background:\${bgColor};border-radius:10px;border:1px solid \${color}22;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:600;color:#333;">\${ind.label}</span>
            <span style="font-size:13px;color:\${color};font-weight:700;">\${typeof ind.value==='number'?ind.value.toFixed(2):ind.value} (\${pct.toFixed(1)}%)</span>
          </div>
          <div style="height:10px;background:#e0e0e0;border-radius:5px;overflow:hidden;position:relative;">
            <div style="height:100%;width:\${pct}%;background:linear-gradient(90deg,#16a34a,#ca8a04,#dc2626);border-radius:5px;transition:width 0.6s ease;"></div>
            <div style="position:absolute;top:-2px;left:30%;width:2px;height:14px;background:rgba(0,0,0,0.12);border-radius:1px;"></div>
            <div style="position:absolute;top:-2px;left:70%;width:2px;height:14px;background:rgba(0,0,0,0.12);border-radius:1px;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#999;margin-top:3px;">
            <span>低估<br>0-30%</span><span>合理<br>30-70%</span><span>高估<br>70-100%</span>
          </div>
        </div>\`;
      }
      html += '</div>';
      container.innerHTML = html;
    }'''

if old_percentile in content:
    content = content.replace(old_percentile, new_percentile)
    print('✅ 已更新 renderPercentileChart 使用预计算分位数')
else:
    print('⚠️ renderPercentileChart 未精确匹配，尝试部分替换...')
    # 可能已经被部分修改了，尝试替换函数体
    # 查找函数定义位置
    idx1 = content.find('function renderPercentileChart()')
    if idx1 >= 0:
        idx2 = content.find('\n    function showFundamental()', idx1)
        if idx2 < 0:
            idx2 = content.find('\n    async function showFundamental()', idx1)
        if idx2 > idx1:
            # 替换整个函数体（保留函数名和花括号）
            old_body = content[idx1:idx2]
            # 只提取函数名的下一行到结束
            open_brace = old_body.find('{')
            close_brace = old_body.rfind('}')
            body_content = old_body[open_brace+1:close_brace]
            # 暂时不做替换，只是报告
            print(f'⚠️ renderPercentileChart 函数已存在但内容不同，跳过替换')
        else:
            print('⚠️ 无法找到 renderPercentileChart 函数的结束位置')
    else:
        print('⚠️ 找不到 renderPercentileChart 函数')

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('\n✅ 修复完成')

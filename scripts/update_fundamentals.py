#!/usr/bin/env python3
"""
下载股票基本面历史数据（PE/PB/ROE/股息率等）
数据来源：AKShare（免费，无需API Key）
输出：data/fundamentals/{code}_history.json
"""
import akshare as ak
import json
import os
from datetime import datetime

def download_fundamental_history(stock_code, exchange="sh"):
    """下载单只股票的基本面历史数据"""
    print(f"正在下载 {exchange}{stock_code} 基本面历史数据...")
    
    try:
        # 获取估值数据（PE/PB/PS/股息率）
        df = ak.stock_financial_abstract(stock=stock_code, symbol="valuation")
        
        history = []
        for _, row in df.iterrows():
            history.append({
                "date": str(row.get('报告期', '')),
                "pe_ttm": float(row.get('市盈率(TTM)', 0) or 0),
                "pb": float(row.get('市净率', 0) or 0),
                "ps_ttm": float(row.get('市销率(TTM)', 0) or 0),
                "dividend_yield": float(row.get('股息率', 0) or 0)
            })
        
        # 获取盈利能力数据（ROE/ROA/毛利率/净利率）
        df_profit = ak.stock_financial_abstract(stock=stock_code, symbol="profit")
        for idx, row in df_profit.iterrows():
            date = str(row.get('报告期', ''))
            # 找到对应日期的数据并补充
            item = next((h for h in history if h["date"] == date), None)
            if item:
                item["roe"] = float(row.get('净资产收益率', 0) or 0)
                item["roa"] = float(row.get('总资产收益率', 0) or 0)
                item["gross_margin"] = float(row.get('毛利率', 0) or 0)
                item["net_margin"] = float(row.get('净利率', 0) or 0)
        
        data = {
            "code": f"{exchange}{stock_code}",
            "name": df.iloc[0]['股票简称'] if not df.empty else stock_code,
            "update_time": datetime.now().strftime("%Y-%m-%d"),
            "history": history
        }
        
        filename = f"data/fundamentals/{exchange}{stock_code}_history.json"
        os.makedirs("data/fundamentals", exist_ok=True)
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 已保存至 {filename} ({len(history)}条记录)")
        
    except Exception as e:
        print(f"❌ 下载失败：{e}")

if __name__ == "__main__":
    # 示例：下载茅台、浦发银行、平安银行的基本面数据
    stocks = [
        ("600519", "sh"),  # 贵州茅台
        ("600000", "sh"),  # 浦发银行
        ("000001", "sz"),  # 平安银行
        ("601318", "sh"),  # 中国平安
        ("002594", "sz"),  # 比亚迪
    ]
    
    for code, exchange in stocks:
        download_fundamental_history(code, exchange)
    
    print("\n✅ 所有股票基本面数据更新完成！")

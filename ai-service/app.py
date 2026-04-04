from flask import Flask, request, jsonify
from flask_cors import CORS
import math
import pandas as pd
import yfinance as yf
import ta
import requests
from concurrent.futures import ThreadPoolExecutor
import random

app = Flask(__name__)
CORS(app)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "Zerodha Stock Predictor"})

def simple_linear_regression(y):
    # X is just 0, 1, 2, ..., n-1
    n = len(y)
    if n == 0: return 0
    sum_x = sum(range(n))
    sum_y = sum(y)
    sum_xy = sum(i * y[i] for i in range(n))
    sum_xx = sum(i * i for i in range(n))
    
    slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x) if (n * sum_xx - sum_x * sum_x) != 0 else 0
    intercept = (sum_y - slope * sum_x) / n
    
    # predict next day (index = n)
    return slope * n + intercept

@app.route("/predict", methods=["POST"])
def predict():
    """
    Expects JSON: { "symbol": "RELIANCE", "historical_prices": [2500, 2520, 2480, 2495, 2510] }
    Returns JSON: { "symbol": "RELIANCE", "predicted_price": 2515.5 }
    """
    data = request.get_json()
    symbol = data.get("symbol", "UNKNOWN")
    historical_prices = data.get("historical_prices", [])

    if not historical_prices or len(historical_prices) < 3:
        return jsonify({"error": "Please provide at least 3 historical prices for prediction."}), 400

    try:
        predicted_price = simple_linear_regression(historical_prices)

        return jsonify({
            "symbol": symbol,
            "predicted_price": round(predicted_price, 2),
            "confidence": "Moderate",
            "model": "Simple Linear Regression (Python Built-in)"
        })

    except Exception as e:
        print(f"[Zerodha-Predictor] Error: {e}")
        return jsonify({"error": str(e)}), 500

def get_data(ticker):
    data = yf.download(ticker, period="3mo", interval="1d", progress=False)
    return data

def add_indicators(data):
    if len(data) > 0 and 'Close' in data:
        # Convert to 1D series just in case
        close_series = data["Close"].squeeze()
        data["rsi"] = ta.momentum.RSIIndicator(close_series).rsi()
        data["macd"] = ta.trend.MACD(close_series).macd()
    return data

def score_stock(data):
    try:
        rsi = float(data["rsi"].iloc[-1])
        macd = float(data["macd"].iloc[-1])
        score = 0
        if rsi < 40:  # Oversold region -> good
            score += 1
        if macd > 0:  # Bullish trend
            score += 1
        return score
    except:
        return 0

def signal(score):
    if score >= 2: return "BUY"
    elif score == 1: return "HOLD"
    else: return "SELL"

@app.route("/scan", methods=["GET", "POST"])
def scan_market():
    try:
        # Fetch NSE Equities list
        url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
        # Use headers because NSE blocks python requests by default occasionally
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers)
        from io import StringIO
        df = pd.read_csv(StringIO(r.text))
        
        stocks = df["SYMBOL"].tolist()
        stocks = [s + ".NS" for s in stocks]
        
        # Taking a fast random sample of 250 stocks to prevent 2-minute timeouts and API bans
        sampled_stocks = random.sample(stocks, min(250, len(stocks)))
        
        results = []
        
        def process_stock(stock):
            try:
                data = get_data(stock)
                if len(data) < 50:
                    return None
                data = add_indicators(data)
                score = score_stock(data)
                return (stock.replace('.NS', ''), score)
            except:
                return None

        with ThreadPoolExecutor(max_workers=10) as executor:
            scans = list(executor.map(process_stock, sampled_stocks))
            
        for item in scans:
            if item:
                results.append(item)
                
        results.sort(key=lambda x: x[1], reverse=True)
        top_stocks = results[:10]
        
        ai_picks = []
        for stock, score in top_stocks:
            ai_picks.append({
                "stock": stock,
                "signal": signal(score)
            })
            
        return jsonify({
            "scanned_count": len(sampled_stocks),
            "total_exchange_count": len(stocks),
            "ai_picks": ai_picks
        })

    except Exception as e:
        print(f"[Scanner Error] {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("[Zerodha-Predictor] Starting Flask predicting server on http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=False)

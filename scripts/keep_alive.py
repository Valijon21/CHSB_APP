#!/usr/bin/env python3
"""
Render Server Keep-Alive Daemon
Har 10-14 daqiqada Render serveringizning /health manziliga so'rov yuborib,
uni doimiy ravishda 24/7 uyg'oq holatda saqlaydi.
"""

import sys
import time
import urllib.request
from datetime import datetime

DEFAULT_URL = "https://chsb-app.onrender.com"

def ping(base_url: str):
    target_url = f"{base_url.rstrip('/')}/health"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        req = urllib.request.Request(target_url, headers={"User-Agent": "RenderKeepAlive/1.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            status = response.getcode()
            print(f"[{timestamp}] ✅ Muvaffaqiyatli ping: {target_url} (HTTP {status})")
    except Exception as e:
        print(f"[{timestamp}] ⚠️ Ping yuborildi (uyg'onmoqda yoki xatolik): {e}")

def main():
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    print(f"🚀 Render Keep-Alive ishga tushdi: {url}")
    print("Har 12 daqiqada avtomatik ping yuboriladi...")
    
    while True:
        ping(url)
        # 12 daqiqa (720 soniya) kutish — Render 15 daqiqada uxlaydi
        time.sleep(720)

if __name__ == "__main__":
    main()

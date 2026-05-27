#!/usr/bin/env python3
import sys
import urllib.request
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

def fetch_one(sku):
    url = f"https://api.mybihr.com/occ/v2/bihres/products/compatibleVehicles?productCode={sku}&page=0&pageSize=120"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode('utf-8'))
            v = data.get("compatibleVehicles", [])
            print(f"SKU {sku}: found {len(v)} in {time.time()-t0:.2f}s", flush=True)
            return len(v)
    except Exception as e:
        print(f"SKU {sku}: error {e} in {time.time()-t0:.2f}s", flush=True)
        return str(e)

def main():
    skus = ["3026780", "3032867", "3063975", "1074533007", "1074827003"]
    print("Starting thread pool...", flush=True)
    with ThreadPoolExecutor(max_workers=5) as ex:
        futures = {ex.submit(fetch_one, sku): sku for sku in skus}
        for f in as_completed(futures):
            print(f"Future completed: {f.result()}", flush=True)

if __name__ == "__main__":
    main()

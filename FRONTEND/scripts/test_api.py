
import requests
import sys

URL = "https://backendescapes.com/wp-json/wc/v3/"
CK = "ck_2b791bb3e39827a857622b55d0effd74239a46c6"
CS = "cs_96d1bc97c3b8e86fa22c17121831dd9ec92d2e6b"
AUTH = (CK, CS)

endpoints = ["system_status", "products", "customers"]

for ep in endpoints:
    print(f"Testing {ep}...")
    try:
        # Test with Basic Auth
        r = requests.get(URL + ep, auth=AUTH, params={"per_page": 1})
        print(f"  Basic Auth: {r.status_code}")
        if r.status_code != 200:
            print(f"    Body: {r.text[:200]}")
            
        # Test with Query Params
        r = requests.get(URL + ep, params={"consumer_key": CK, "consumer_secret": CS, "per_page": 1})
        print(f"  Query Params: {r.status_code}")
        if r.status_code != 200:
            print(f"    Body: {r.text[:200]}")
            
    except Exception as e:
        print(f"  Error: {e}")

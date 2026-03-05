
import requests
URL = "https://backendescapes.com/wp-json/wc/v3/products"
CK = "ck_2b791bb3e39827a857622b55d0effd74239a46c6"
CS = "cs_96d1bc97c3b8e86fa22c17121831dd9ec92d2e6b"
r = requests.get(URL, auth=(CK, CS), params={"per_page": 1})
print(f"Status: {r.status_code}")
print(f"Response: {r.text}")

import sys
import json
import urllib.request

url = "http://localhost:8000/api/chat"
data = json.dumps({"query": "how many incidents happened in btm", "history": []}).encode("utf-8")
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode())
        print("Answer:", result.get("answer"))
        print("\nSources:", [s.get("id") for s in result.get("sources", [])])
except Exception as e:
    print("Error:", e)

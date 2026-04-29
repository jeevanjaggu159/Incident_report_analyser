from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    try:
        yield "db"
    except Exception as e:
        print("Dependency caught exception")
        raise

@app.post("/test")
def test(db=Depends(get_db)):
    raise HTTPException(status_code=429, detail={"error": "quota", "suggestion": "upgrade"})

import threading
import uvicorn
import requests
import time

def run():
    uvicorn.run(app, host="127.0.0.1", port=8002, log_level="critical")

threading.Thread(target=run, daemon=True).start()
time.sleep(1)

# Check CORS headers
res = requests.options("http://127.0.0.1:8002/test", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"})
print("OPTIONS Headers:", res.headers)

res = requests.post("http://127.0.0.1:8002/test", headers={"Origin": "http://localhost:3000"})
print("POST Headers:", res.headers)
print("Response:", res.text)

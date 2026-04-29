from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import asyncio

app = FastAPI()

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    print("GENERAL EXCEPTION HANDLER CALLED")
    return JSONResponse(
        status_code=500,
        content={"detail": "caught by general"}
    )

@app.get("/test")
def test():
    raise HTTPException(status_code=429, detail="too many")

import threading
import uvicorn
import requests
import time

def run():
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="critical")

threading.Thread(target=run, daemon=True).start()
time.sleep(1)
print(requests.get("http://127.0.0.1:8001/test").json())

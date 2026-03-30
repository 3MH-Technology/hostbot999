from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import asyncio

app = FastAPI(title="BotOps API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BotCreate(BaseModel):
    name: str
    language: str
    env_vars: dict

class BotUpdate(BaseModel):
    status: str

# Mock DB
bots_db = {
    "1": {"id": "1", "name": "SupportBot", "status": "running", "language": "python", "cpu": 12, "ram": 145},
    "2": {"id": "2", "name": "CryptoTracker", "status": "stopped", "language": "nodejs", "cpu": 0, "ram": 0},
}

@app.get("/api/bots")
async def get_bots():
    return list(bots_db.values())

@app.get("/api/bots/{bot_id}")
async def get_bot(bot_id: str):
    if bot_id not in bots_db:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bots_db[bot_id]

@app.post("/api/bots")
async def create_bot(bot: BotCreate):
    new_id = str(len(bots_db) + 1)
    new_bot = {"id": new_id, **bot.dict(), "status": "stopped", "cpu": 0, "ram": 0}
    bots_db[new_id] = new_bot
    return new_bot

@app.post("/api/bots/{bot_id}/start")
async def start_bot(bot_id: str):
    if bot_id not in bots_db:
        raise HTTPException(status_code=404, detail="Bot not found")
    bots_db[bot_id]["status"] = "running"
    return {"message": f"Bot {bot_id} started"}

@app.post("/api/bots/{bot_id}/stop")
async def stop_bot(bot_id: str):
    if bot_id not in bots_db:
        raise HTTPException(status_code=404, detail="Bot not found")
    bots_db[bot_id]["status"] = "stopped"
    return {"message": f"Bot {bot_id} stopped"}

@app.websocket("/api/bots/{bot_id}/logs")
async def websocket_logs(websocket: WebSocket, bot_id: str):
    await websocket.accept()
    try:
        while True:
            await asyncio.sleep(2)
            await websocket.send_text(f"[LOG] Bot {bot_id} is running fine...")
    except Exception:
        pass

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

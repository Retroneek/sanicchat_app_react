from sanic import Sanic, Request, Websocket
from sanic.response import json
from sanic_cors import CORS
import json as pyjson
import os

app = Sanic("WebSocketServer")
CORS(app)

MESSAGE_HISTORY_FILE = "message_history.json"

def load_message_history():
    if os.path.exists(MESSAGE_HISTORY_FILE):
        try:
            with open(MESSAGE_HISTORY_FILE, "r") as f:
                return pyjson.load(f)
        except (pyjson.JSONDecodeError, ValueError):
            # File empty or invalid JSON; start fresh
            return []
    return []

def save_message_history(history):
    with open(MESSAGE_HISTORY_FILE, "w") as f:
        pyjson.dump(history, f)

message_history = load_message_history()
connected_clients = set()

async def broadcast(payload: str):
    for ws in list(connected_clients):
        try:
            await ws.send(payload)
        except:
            connected_clients.discard(ws)

@app.websocket("/ws")
async def feed(request: Request, ws: Websocket):
    connected_clients.add(ws)

    # Send existing history on connect
    if message_history:
        await ws.send("MESSAGE_HISTORY:" + pyjson.dumps(message_history))

    # Broadcast updated user count
    await broadcast(f"USERS_UPDATE:{len(connected_clients)}")

    try:
        async for raw in ws:
            try:
                data = pyjson.loads(raw)
            except:
                data = None

            if isinstance(data, dict) and 'username' in data and 'message' in data:
                message_history.append(data)
                save_message_history(message_history)
                await broadcast(raw)
            else:
                await broadcast(raw)
    finally:
        connected_clients.discard(ws)
        await broadcast(f"USERS_UPDATE:{len(connected_clients)}")

@app.post("/get_users")
async def get_users(request: Request):
    return json({"message": "User data received", "data": request.json})

@app.get("/")
async def index(request: Request):
    return json({"message": "WebSocket server is running"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)

from sanic import Sanic, Request, Websocket
from sanic.response import json
from sanic_cors import CORS
from user_management import user_initialization
import json
import os

app = Sanic("WebSocketServer")
CORS(app)
connected_clients = set()
MESSAGE_HISTORY_FILE = "message_history.json"

def load_message_history():
    if os.path.exists(MESSAGE_HISTORY_FILE):
        with open(MESSAGE_HISTORY_FILE, "r") as file:
            return json.load(file)
    return []

def save_message_history(history):
    with open(MESSAGE_HISTORY_FILE, "w") as file:
        json.dump(history, file)

message_history = load_message_history()

async def broadcast(message):
    for client in connected_clients:
        await client.send(message)

@app.websocket("/ws")
async def ws_handler(request: Request, ws: Websocket):
    connected_clients.add(ws)
    try:
        if message_history:
            await ws.send(f"MESSAGE_HISTORY:{json.dumps(message_history)}")

        users_count = len(connected_clients)
        await broadcast(f"USERS_UPDATE:{users_count}")

        async for message in ws:
            message_history.append(message)
            save_message_history(message_history)
            await broadcast(message)
    finally:
        connected_clients.remove(ws)
        users_count = len(connected_clients)
        await broadcast(f"USERS_UPDATE:{users_count}")

@app.post("/get_users")
async def get_users(request: Request):
    user_data = request.json
    user_initialization(user_data)
    return json({"message": "User data received", "data": user_data})

@app.get("/")
async def index(request: Request):
    return json({"message": "WebSocket server is running!"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
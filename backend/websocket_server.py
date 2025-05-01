from sanic import Sanic, Request, Websocket
from sanic.response import json
from sanic_cors import CORS
import bcrypt
import json as pyjson
import os, jwt, datetime

app = Sanic("LumeraChatServer")
CORS(app)

SECRET_KEY = "548375838H83H3FF7G37G37B37G37AG"
USERS_FILE = "users.json"
HISTORY_FILE = "message_history.json"

def load_json(path):
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                return pyjson.load(f)
        except (pyjson.JSONDecodeError, ValueError):
            return []
    return []

def save_json(path, data):
    with open(path, "w") as f:
        pyjson.dump(data, f)

message_history = load_json(HISTORY_FILE)
connected_clients = set()

@app.post("/register")
async def register(request):
    body = request.json or {}
    u, p = body.get("username"), body.get("password")
    if not u or not p:
        return json({"success": False, "error": "Username and password required"}, status=400)

    users = load_json(USERS_FILE)
    if any(x["username"] == u for x in users):
        return json({"success": False, "error": "Username already taken"}, status=400)

    # Hash the password before saving
    hashed = bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
    users.append({"username": u, "password": hashed})
    save_json(USERS_FILE, users)

    token = jwt.encode(
        {"username": u, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12)},
        SECRET_KEY,
        algorithm="HS256"
    )
    return json({"success": True, "token": token})


@app.post("/login")
async def login(request):
    body  = request.json or {}
    u, p  = body.get("username"), body.get("password")
    users = load_json(USERS_FILE)

    # Find user and verify password
    entry = next((x for x in users if x["username"] == u), None)
    if not entry or not bcrypt.checkpw(p.encode(), entry["password"].encode()):
        return json({"success": False, "error": "Invalid credentials"}, status=401)

    token = jwt.encode(
        {"username": u, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12)},
        SECRET_KEY,
        algorithm="HS256"
    )
    return json({"success": True, "token": token})

async def broadcast(msg: str):
    for ws in list(connected_clients):
        try:
            await ws.send(msg)
        except:
            connected_clients.discard(ws)

@app.websocket("/ws")
async def feed(request: Request, ws: Websocket):
    token = request.args.get("token")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        username = payload["username"]
    except:
        await ws.close(code=4001)
        return

    connected_clients.add(ws)
    # send history and user count
    if message_history:
        await ws.send("MESSAGE_HISTORY:" + pyjson.dumps(message_history))
    await broadcast(f"USERS_UPDATE:{len(connected_clients)}")

    try:
        async for raw in ws:
            # parse incoming JSON or treat as text
            try:
                data = pyjson.loads(raw)
                text = data.get("message", "")
            except:
                text = raw

            chat = {"username": username, "message": text}
            message_history.append(chat)
            save_json(HISTORY_FILE, message_history)
            await broadcast("CHAT_MESSAGE:" + pyjson.dumps(chat))
    finally:
        connected_clients.discard(ws)
        await broadcast(f"USERS_UPDATE:{len(connected_clients)}")

@app.get("/")
async def index(request):
    return json({"message": "Lumera Chat Server is running"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)

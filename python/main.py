from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routes.createUser import createUser
import json, os, base64
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from routes.createRoom import createRoom
import qrcode
import secrets
from fastapi.responses import FileResponse


current_dir = os.path.dirname(os.path.abspath(__file__))
users_json_path = os.path.join(current_dir, "..", "Users.json")
users_json_path = os.path.abspath(users_json_path)

rooms_json_path = os.path.join(current_dir, "..", "Rooms.json")
rooms_json_path = os.path.abspath(rooms_json_path)



class UserOnlineMap:
    def __init__(self):
        self.onlineUser = {}
        
    def ConnectUser(self, websocket: WebSocket, userID: str):
        self.onlineUser[userID] = websocket
    
    def disConnect(self, userID: str):
        del self.onlineUser[userID]
        
onlineUser = UserOnlineMap()
room_connections = {} 

origins = [
    "http://localhost:3000",
    "http://localhost:2000",
    "http://127.0.0.1:3000",
    "http://localhost",
    "http://127.0.0.1",
    "http://127.0.0.1:2000"
]
allow_origins=["*"]


subServer = FastAPI()

subServer.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

activeRoom = {}
messages = {}

@subServer.post("/sub-server/createUser")
async def createUserSubServer(request: Request):
    data = await request.json()
    createUser(data)
    return {"status": "ok"}

async def update_status(user_id: str, status: bool):
    
    with open(users_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    if user_id in data:
        data[user_id]["statusNetwork"] = status
        with open(users_json_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        return True
    
    return False

@subServer.get("/sub-server/autorization/{userID}/{password}")
async def autorization(userID: str, password: str):
    with open(users_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if userID in data and password == data[userID]["password"]:
        return {"status": "ok"}
    return {"status": "error"}

    


@subServer.post("/sub-server/setOnline")
async def setUserOnline(request: Request):
    body = await request.json()
    success = await update_status(str(body["userID"]), True)
    print(body["userID"])
    return {"status": "ok" if success else "user_not_found"}

@subServer.post("/sub-server/setOffline")
async def setUserOffline(request: Request):
    body = await request.json()
    success = await update_status(body["userID"], False)
    return {"status": "ok" if success else "user_not_found"}


@subServer.post("/sub-server/blockUser")
async def blockUser(request: Request):
    body = await request.json()
    user_id = body["User"]
    blocked_id = body["BlockedUser"]
    
    with open(users_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    if blocked_id not in data[user_id]["userBlock"]:
        data[user_id]["userBlock"].append(blocked_id)
            
    with open(users_json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    return {"status": "ok"}

@subServer.post("/sub-server/unblockUser")
async def unblockUser(request: Request):
    body = await request.json()
    user_id = body["User"]
    blocked_id = body["BlockedUser"]
    
    with open(users_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    if user_id in data and blocked_id in data[user_id]["userBlock"]:
        data[user_id]["userBlock"].remove(blocked_id)
        
    with open(users_json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    return {"status": "ok"}



@subServer.post("/sub-server/sendHashedMessage")
async def sendHashedMessage(request: Request):
    import base64
    body = await request.json()
    message_bytes = body["message"].encode("utf-8")


    pub_b64 = body["public_key"].replace('\n', '').replace('\r', '')
    pub_pem = base64.b64decode(pub_b64)

    try:
        public_key = serialization.load_pem_public_key(pub_pem)
    except Exception as e:
        return {"error": f"Failed to load public key: {e}"}

    encrypted = public_key.encrypt(
        message_bytes,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return {"encrypted_message": base64.b64encode(encrypted).decode("utf-8")}


@subServer.post("/sub-server/getHashedMessage")
async def getHashedMessage(request: Request):
    body = await request.json()
    enc_bytes = base64.b64decode(body["encrypted_message"])
    priv_b64 = body["private_key"].replace('\n', '').replace('\r', '')
    priv_pem = base64.b64decode(priv_b64)
    private_key = serialization.load_pem_private_key(priv_pem, password=None)
    decrypted = private_key.decrypt(
        enc_bytes,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return {"decrypted_message": decrypted.decode("utf-8")}



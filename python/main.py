<<<<<<< HEAD
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

=======
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask
from PIL import Image
import io
import uuid
>>>>>>> 5f1bff987eb330bad4ad92e892183f4b4dceb392


<<<<<<< HEAD
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

=======
>>>>>>> 5f1bff987eb330bad4ad92e892183f4b4dceb392

subServer = FastAPI()

active_qrs = {}

<<<<<<< HEAD
activeRoom = {}
messages = {}

@subServer.post("/sub-server/createUser")
async def createUserSubServer(request: Request):
    data = await request.json()
    createUser(data)
    return {"status": "ok"}

async def update_status(user_id: str, status: bool):
=======
@subServer.get("/sub-server/generate-qr")
def generate_qr():
    token = str(uuid.uuid4())
    expire_time = datetime.utcnow() + timedelta(minutes=5)
    active_qrs[token] = expire_time

>>>>>>> 5f1bff987eb330bad4ad92e892183f4b4dceb392
    
    background = Image.open("back.jpg").convert("RGBA")
    logo = Image.open("logo.jpg").convert("RGBA")

<<<<<<< HEAD
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
=======
    # Генерация QR с закруглёнными модулями
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H
>>>>>>> 5f1bff987eb330bad4ad92e892183f4b4dceb392
    )
    qr.add_data(token)
    qr.make(fit=True)

    img_qr = qr.make_image(
        image_factory=StyledPilImage,
        color_mask=SolidFillColorMask(back_color=(255,255,255), front_color=(0,0,0))
    )


<<<<<<< HEAD
=======
    img_qr = img_qr.resize(background.size, Image.Resampling.LANCZOS)
    
    logo_size = int(img_qr.size[0] * 0.2)
    logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

    
    pos = ((img_qr.size[0] - logo_size) // 2, (img_qr.size[1] - logo_size) // 2)
    img_qr.paste(logo, pos, logo)

   
    background = background.resize(img_qr.size)
    combined = Image.alpha_composite(background, img_qr)

    
    buf = io.BytesIO()
    combined.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")


@subServer.post("/sub-server/check-qr")
def checkQR(request: Request):
    data = request.get()
>>>>>>> 5f1bff987eb330bad4ad92e892183f4b4dceb392

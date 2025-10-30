from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect

import base64


class User:
    def __init__(self, idUser, name):
        self.idUser = idUser
        self.name = name 
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        self.public_key = self.private_key.public_key()
        self.statusNetwork = False
        self.blocked_users = []
        
    def getPrivateKey(self):
        private_bytes = self.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        )
        return base64.b64encode(private_bytes).decode("utf-8")
    
    def getPublicKey(self):
        public_bytes =  self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return base64.b64encode(public_bytes).decode("utf-8")
        
    def online(self):
        self.statusNetwork = True
        
    def ofline(self):
        self.statusNetwork = False
        
    def blockUser(self,idBlocked):
        self.blocked_users.append(idBlocked)

    def unBlockUser(self, idUnBlocked):
        self.blocked_users.remove(idUnBlocked)
        
    def isBlocked(self, idChecked):
        if idChecked not in self.blocked_users:
            return False
        else:
            return True
    

class AvtiveManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        self.active_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_message(self, websocket: WebSocket, message: str):
        await websocket.send_text(message)


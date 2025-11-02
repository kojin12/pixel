from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
import json
import os

import base64

current_dir = os.path.dirname(os.path.abspath(__file__))
users_json_path = os.path.join(current_dir, "..","..","Users.json")
users_json_path = os.path.abspath(users_json_path)


def createRoom(user1ID, user2ID):
    with open(users_json_path, "r", encoding='utf-8') as f:
        data = json.load(f) 

    if user1ID in data and user2ID in data:
        if user2ID not in data[user1ID]["userBlock"] and user1ID not in data[user2ID]["userBlock"]:
            roomName = f"{user1ID}_{user2ID}"
            publicKey_user1 = data[user1ID]["publicKey"] 
            publicKey_user2 = data[user2ID]["publicKey"]
    
            return {
                f"{roomName}": {
                    "connections":{},
                    "keys" : {
                        f"publicKey_{user1ID}": publicKey_user1,
                        f"publicKey_{user2ID}": publicKey_user2
                    },
                    "messages": {}
                }
            }
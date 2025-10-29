from flask import Flask,request
from flask_cors import CORS
from flask import jsonify
from routes.createUser import createUser
import json
import os
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization


current_dir = os.path.dirname(os.path.abspath(__file__))
users_json_path = os.path.abspath(os.path.join(current_dir, "..", "Users.json"))

subServer = Flask(__name__)
CORS(subServer)


@subServer.route("/sub-server/createUser", methods = ["POST"])
def createUserSubServer():
    data = request.get_json()
    
    createUser(data)
    
    return jsonify({"status":"ok"})


@subServer.route("/sub-server/setOnline", methods = ["POST"])
def setUserOnline():
    userID = request.get_json()
    
    with open(users_json_path, "r", encoding='utf-8') as f:
        data = json.load(f)
        
    thisUser = data[userID["userID"]]
    
    if userID in data:
        thisUser["statusNetwork"] = "True"

    data.append(thisUser)
    
    with open(users_json_path, "w", encoding='utf-8') as f:
        json.dump(data)
        
    return jsonify({"status":"ok"})
    
@subServer.route("/sub-server/setOfline", methods = ["POST"])
def setUserOfline():
    userID = request.get_json()
    
    with open(users_json_path, "r", encoding='utf-8') as f:
        data = json.load(f)
        
    thisUser = data[userID["userID"]]
    
    if userID in data:
        thisUser["statusNetwork"] = "False"

    data.append(thisUser)
    
    with open(users_json_path, "w", encoding='utf-8') as f:
        json.dump(data)

    return jsonify({"status":"ok"})


@subServer.route("/sub-server/blockUser", methods = ["POST"])
def blockUser():
    userID = request.get_json()

    with open(users_json_path, "r", encoding='utf-8') as f:
        data = json.load(f)
    
    data[userID["User"]]["userBlock"].append(data[userID["BlockedUser"]])
    
    with open(users_json_path, "w", encoding='utf-8') as f:
        json.dump(data)

    return jsonify({"status":"ok"})

@subServer.route("/sub-server/UnblockUser", methods = ["POST"])
def UnblockUser():
    userID = request.get_json()

    with open(users_json_path, "r", encoding='utf-8') as f:
        data = json.load(f)
    
    data[userID["User"]]["userBlock"].remove(data[userID["BlockedUser"]])
    
    with open(users_json_path, "w", encoding='utf-8') as f:
        json.dump(data)

    return jsonify({"status":"ok"})

@subServer.route("/sub-server/SendHashedMessage", methods = ["POST"])
def SendHashedMessage():
    message = request.get_json()
    
    message_bytes = message["message"].encode('utf-8')
    
    encrypted_message = message["public_key"].encrypt(
        message_bytes,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
        
    return jsonify({"encrypted_message":encrypted_message})
    
    
@subServer.route("/sub-server/GetHashedMessage", methods = ["POST"])
def GetHashedMessage():
    message = request.get_json()
        
    decrypted_message = message["private_key"].decrypt(
        message["encrypted_message"],
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
            
    )
    
    return jsonify({"decrypted_message":decrypted_message})

if __name__ == "__main__":
    subServer.run(debug=True)
    
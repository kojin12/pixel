from .logic import User
import json
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
users_json_path = os.path.abspath(os.path.join(current_dir, "..", "..", "Users.json"))

def createUser(userInfo):
    newUser = User(userInfo["idUser"], userInfo["name"])
    
    publicKey = newUser.getPublicKey()
    privateKey = newUser.getPrivateKey()
    

    if not os.path.exists(users_json_path) or os.path.getsize(users_json_path) == 0:
        data = {}
    else:
        with open(users_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    
    data[str(newUser.idUser)] = {
        "userName": newUser.name,
        "userBlock": newUser.blocked_users,
        "publicKey": publicKey,
        "privateKey": privateKey,
        "statusNetwork": newUser.statusNetwork
    }
    
    with open(users_json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


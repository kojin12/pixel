from logic import User
import json
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
users_json_path = os.path.abspath(os.path.join(current_dir, "..", "..", "Users.json"))

def createUser(userInfo):
    newUser = User(userInfo["idUser"], userInfo["name"])
    
    publicKey = newUser.get_public_pem()
    privateKey = newUser.getPrivateKey()
    
    newUserMap = {
        newUser.idUser:{
            "userName": newUser.name,
            "userBlock": newUser.blocked_users,
            "publicKey": publicKey,
            "privateKey": privateKey,
            "statusNetwork": newUser.statusNetwork
        }

    }
    
    with open(users_json_path, "r", encoding='utf-8') as f:
        data = json.load(f)
        
    data.append(newUserMap)
    
    with open(users_json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
        

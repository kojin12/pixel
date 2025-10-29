from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization




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
        return self.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        )
        
    def getPublicKey(self):
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
    def online(self):
        self.statusNetwork = True
        
    def ofline(self):
        self.statusNetwork = False
        
    def blockUser(self,idBlocked):
        self.blocked_users.append(idBlocked)

    def unBlockUser(self, idUnBlocked):
        self.blocked_users.remove(idUnBlocked)
        
    def isBlocked(self, idChecked):
        if  idChecked not in self.blocked_users:
            return False
        else:
            return True
    
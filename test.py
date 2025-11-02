import requests

API = "http://127.0.0.1:8000/sub-server"

# Создание пользователей
print(requests.post(f"{API}/createUser", json={"idUser": "user1", "name": "Ivan"}).json())
print(requests.post(f"{API}/createUser", json={"idUser": "user2", "name": "Anna"}).json())

# Создание комнаты
print(requests.post(f"{API}/createRoom", json={"user1": "user1", "user2": "user2"}).json())

# Установка онлайн/оффлайн
print(requests.post(f"{API}/setOnline", json={"userID": "user1"}).json())
print(requests.post(f"{API}/setOffline", json={"userID": "user1"}).json())

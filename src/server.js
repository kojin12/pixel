import express from 'express'
import bodyParser from "body-parser";
import fs, { stat } from "fs";
import path, { join } from "path";
import { fileURLToPath } from "url";
import WebSocket from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//IMPORTS

//PATHS
const usersPath = path.join(__dirname, 'data', 'users.json');
const roomsPath = path.join(__dirname, 'data', 'rooms.json');
//PATHS

//CONSTS

const core = express()
const PORT = 3000

//CONSTS

//MIDLLEWARE

core.use(express.json())
core.use(bodyParser.urlencoded({extended:true}))

//MIDLLEWARE

//SOCKETS
const wss = new WebSocket.Server({ port: 8080 });

const clients = {}

wss.on('connection', async(ws, req) => {

    const users = openUSERS()

    ws.on('message', async(message) => {

        const data = JSON.parse(message)

        users[data.user1].statusNetwork = true;
        users[data.user2].statusNetwork = true;

        saveUSERS(users)


        if (data.type === "login"){

            clients[data.userID] = ws

        }

        if (data.type === "message"){
            const rooms = openROOMS()

            const room = rooms[data.roomsID];

            if (!User1.blockedUser.includes(data.user2) && !User2.blockedUser.includes(data.user1)){

                if (room) {

                    [room.user1, room.user2].forEach(userId => {
                        if (clients[userId]) {
                            clients[userId].send(JSON.stringify({
                                type: "message",
                                from: data.from,
                                text: data.text,
                                roomId: data.roomId
                            }));
                        }
                    });

                    const messages = room.messages || [];
                    messages.push({ id: messages.length + 1, from: data.from, text: data.text });
                    room.messages = messages;
                    saveROOMS(rooms);
                }
            }

        }

        ws.on('close', () => {

            users[data.user1].statusNetwork = false;
            users[data.user2].statusNetwork = false;

            saveUSERS(users)

            for(let id in clients){
                if(clients[id] === ws) delete clients[id]
            }
        })

    });
});

//FUNCTION

const openUSERS = () => {
    return JSON.parse(fs.readFileSync(usersPath, "utf-8"))
}

const saveUSERS = (data) => {
    fs.writeFileSync(usersPath, JSON.stringify(data, null, 2))
}

const openROOMS = () => {
    return JSON.parse(fs.readFileSync(roomsPath, "utf-8"))
}

const saveROOMS = (data) => {
    fs.writeFileSync(roomsPath, JSON.stringify(data, null, 2))
}

//FUNCTION

//CLASS

//USER

class User {
    constructor(name, id, password) {
        this.name = name;
        this.id = id;
        this.blockedUser = [];
        this.password = password;
        this.statusNetwork = false;
        this.rooms = [];
    }

    saveUserBD() {
        const data = openUSERS();
        data[this.id] = {
            name: this.name,
            blockedUser: this.blockedUser,
            statusNetwork: this.statusNetwork,
            password: this.password,
            rooms: this.rooms
        };
        saveUSERS(data); 
    }

    blockUser(idUserBlock) {
        if (!this.blockedUser.includes(idUserBlock)) {
            this.blockedUser.push(idUserBlock);
        }
        const data = openUSERS();
        data[this.id].blockedUser = this.blockedUser;
        saveUSERS(data);
    }

    UnBlockUser(idUnBlockUser) {
        const data = openUSERS();
        if (data[this.id].blockedUser.includes(idUnBlockUser)) {
            data[this.id].blockedUser = data[this.id].blockedUser.filter(user => user !== idUnBlockUser);
            saveUSERS(data);
        }
    }

}

// USER
//ROOM

class Room{
    constructor(idRoom, user1,user2){
        this.idRoom = idRoom,
        this.user1 = user1,
        this.user2 = user2,
        this.messages = []
    }

    createRoom(){
        const data = openROOMS()
        
        data[this.idRoom] = {
            user1: this.user1,
            user2: this.user2,
            messages: []
        }

        saveROOMS(data)
    }

    getOut(userID){
        const data = openROOMS()

        if (data[this.idRoom]) {
            if (data[this.idRoom].user1 === userID) data[this.idRoom].user1 = null;
            if (data[this.idRoom].user2 === userID) data[this.idRoom].user2 = null;
        }

        saveROOMS(data)
    }

    deleteROOM(){
        const data = openROOMS()

        delete data[this.idRoom]

        saveROOMS(data)

    }
}

//ROOM
//MESSAGE

class Messages{
    constructor(from, to, roomID, text){
        this.from = from,
        this.to = to,
        this.roomID = roomID,
        this.text = text
    }

    sendMessage() {
        const data = openROOMS();

        let messages = data[this.roomID].messages || [];
        let i = messages.length > 0 ? messages[messages.length - 1].id : 0;

        const objMessage = {
            id: i + 1,
            from: this.from,
            to: this.to,
            text: this.text
        };

        messages.push(objMessage);
        data[this.roomID].messages = messages;

        saveROOMS(data);
    }

}

//CLASS

//ENDPOINTS

core.get("/", async(req,res) => {
    res.json({bestMessenger:"PIXEL"})
})

core.post("/api/createUser", async(req, res) => {
    const newUserData = req.body;

    const newUser = new User(newUserData.name, newUserData.id, newUserData.password)
    newUser.saveUserBD()

    res.json({status:"ok"})
 
})

core.post("/api/authoruzation", async(req, res) => {
    const autData = req.body
    const data = openUSERS()

    if (autData.id in data){
        if (data[autData.id].password === autData.password ){
            res.json({status:"ok"})
        }
        else{
            res.json({status:"no"})
        }
    }
    else{
        res.json({status:"false"})
    }
})

core.post("/api/create-room",async(req,res) => {
    const roomData = req.body
    const data = openROOMS()

    if (!(roomData.idRoom in data)) {
        const newRoom = new Room(roomData.idRoom, roomData.user1, roomData.user2)
        newRoom.createRoom()

        users = openUSERS()

        users[roomData.user1].rooms.push(roomData.idRoom)
        users[roomData.user2].rooms.push(roomData.idRoom)
        
        saveUSERS(users);

        res.json({status:"ok"})

    }
    
})

//ENDPOINTS

core.listen(PORT, () => {console.log(`https:localhost:${PORT}`)})
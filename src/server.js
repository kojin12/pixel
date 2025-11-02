import express from 'express'
import bodyParser from "body-parser";
import fs, { stat } from "fs";
import path, { join, resolve } from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { rejects } from 'assert';
import cors from 'cors';
import { isPromise } from 'util/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//IMPORTS

//PATHS
const usersPath = path.join(__dirname, 'data', 'users.json');
const roomsPath = path.join(__dirname, 'data', 'rooms.json');
const groupsPath = path.join(__dirname, 'data', 'groups.json');
const channelsPath = path.join(__dirname, 'data', 'channels.json');
//PATHS

//CONSTS
const PORT = 3000;
const core = express();
core.use(cors());
core.use(express.json());
core.use(bodyParser.urlencoded({ extended: true }));

//CONSTS

//PROMISE

let prom = Promise.resolve();


function promSave(filePath, data) {
    prom = prom.then(() => {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
    return prom;
}



//PROMISE

//SOCKETS
const wss = new WebSocketServer({ port: 8080 });
const clients = {};

wss.on('connection', (ws) => {
    let currentUser = null;

    ws.on('message', async (message) => {
        if (message instanceof Buffer) message = message.toString('utf-8');

        let data;
        try { data = JSON.parse(message); }
        catch (err) { console.log("Ошибка парсинга JSON:", message); return; }

        const users = await openUSERS();
        const rooms = await openROOMS();

        if (data.type === 'login') {
            currentUser = data.userID;
            if (!users[currentUser]) {
                users[currentUser] = { name: data.name || currentUser, password: '', blockedUser: [], statusNetwork: true, rooms: [] };
            } else {
                users[currentUser].statusNetwork = true;
            }
            clients[currentUser] = ws;
            await saveUSERS(users);
            console.log(`${currentUser} вошёл в WebSocket`);

            
            ws.send(JSON.stringify({ type: 'updateRooms', rooms: users[currentUser].rooms || [] }));
            return;
        }

        if (data.type === 'message') {
            const room = rooms[data.roomsID];
            if (!room) return;

            room.messages = room.messages || [];
            room.messages.push({ id: room.messages.length + 1, from: data.from, text: data.text });
            await saveROOMS(rooms);

            [room.user1, room.user2].forEach(uid => {
                if (clients[uid]) {
                    clients[uid].send(JSON.stringify({ type: 'message', from: data.from, text: data.text, roomId: data.roomsID }));
                }
            });
        }

        if (data.type === 'updateRooms') {
            const userRooms = users[data.userID]?.rooms || [];
            ws.send(JSON.stringify({ type: 'updateRooms', rooms: userRooms }));
        }
    });

    ws.on('close', async () => {
        if (currentUser) {
            const users = await openUSERS();
            if (users[currentUser]) users[currentUser].statusNetwork = false;
            delete clients[currentUser];
            await saveUSERS(users);
            console.log(`${currentUser} вышел из WebSocket`);
        }
    });
});

//SOCKETS

//FUNCTION

const openUSERS = async () => {
    const data = await fs.promises.readFile(usersPath, "utf-8");
    return JSON.parse(data);
}

const saveUSERS = async (data) => {
    await promSave(usersPath, data);
}

const openROOMS = async () => {
    const data = await fs.promises.readFile(roomsPath, 'utf-8');
    return JSON.parse(data);
}

const openGROUPS = async () => {
    const data = await fs.promises.readFile(roomsPath, 'utf-8');
    return JSON.parse(data);
}

const openCHANNELS = async () => {
    const data = await fs.promises.readFile(channelsPath, 'utf-8');
    return JSON.parse(data)
}


const saveGROUPS = async (data) => {
    await promSave(groupsPath, data);
}


const saveROOMS = async (data) => {
    await promSave(groupsPath, data);
}

const saveCHANNELS = async (data) => {
    await promSave(channelsPath, data)
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

    async saveUserBD() {
        const data = await openUSERS();
        data[this.id] = {
            name: this.name,
            blockedUser: this.blockedUser,
            statusNetwork: this.statusNetwork,
            password: this.password,
            rooms: this.rooms
        };
        await saveUSERS(data);
    }

    async blockUser(idUserBlock) {
        if (!this.blockedUser.includes(idUserBlock)) this.blockedUser.push(idUserBlock);
        const data = await openUSERS();
        data[this.id].blockedUser = this.blockedUser;
        await saveUSERS(data);
    }

    async UnBlockUser(idUnBlockUser) {
        const data = await openUSERS();
        data[this.id].blockedUser = data[this.id].blockedUser.filter(user => user !== idUnBlockUser);
        await saveUSERS(data);
    }

}

// USER

//GROUPS

class Group{
    constructor(idGroup, users){
        this.idGroup = idGroup,
        this.users = users,
        this.owners = []
    }

    async createGroup(){
        const data = await openGROUPS()

        data[this.idGroup] = {
            users: this.users,
            owners: this.owners
        }

        await saveGROUPS(data);
    }
}

//GROUPS

//CHANNELS

class Channel{
    constructor(idChannel,owners){
        this.idChannel = idChannel,
        this.owners = owners,
        this.subscribes = [],
        this.admins = []
    }

    async createChannel (){
        channels = await openCHANNELS();

        channels[this.idChannel] = {
            owners: this.owners,
            subscribes: this.subscribes,
            admins: this.admins
        }

        await saveCHANNELS()
    }

}

//CHANNELS

//ROOM

class Room{
    constructor(idRoom, user1,user2){
        this.idRoom = idRoom,
        this.user1 = user1,
        this.user2 = user2,
        this.messages = []
    }

    async createRoom(){
        const data = await openROOMS()
        
        data[this.idRoom] = {
            user1: this.user1,
            user2: this.user2,
            messages: []
        }

        await saveROOMS(data)
    }

    async getOut(userID){
        const data = await openROOMS()

        if (data[this.idRoom]) {
            if (data[this.idRoom].user1 === userID) data[this.idRoom].user1 = null;
            if (data[this.idRoom].user2 === userID) data[this.idRoom].user2 = null;
        }

        await saveROOMS(data)
    }

    async deleteROOM(){
        const data = await openROOMS()

        delete data[this.idRoom]

        await saveROOMS(data)

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

    async sendMessage() {
        const data = await openROOMS();

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

        await saveROOMS(data);
    }

}

//CLASS

//ENDPOINTS

core.get("/", async(req,res) => {
    res.json({bestMessenger:"PIXEL"})
})

core.post("/api/createUser", async (req, res) => {
    const newUserData = req.body;

    let data;
    try {
        data = await openUSERS();
        if (!data || typeof data !== "object") data = {};
    } catch (err) {
        data = {};
    }

    const userIds = Object.keys(data).map(id => Number(id)).filter(id => !isNaN(id));
    const newId = userIds.length > 0 ? Math.max(...userIds) + 1 : 1;

    const newUser = new User(newUserData.name || `user${newId}`, newId, newUserData.password || "");
    await newUser.saveUserBD();

    res.json({ status: "ok", id: newId });
    console.log(`New User created with ID: ${newId}`);
});



core.post("/api/authoruzation", async (req, res) => {
    const { name, password } = req.body;
    const users = await openUSERS();

    const userEntry = Object.entries(users).find(([id, user]) => user.name === name);

    if (!userEntry) {
        res.json({ status: "false" }); 
        return;
    }

    const [userId, user] = userEntry;

    if (user.password === password) {
        res.json({ status: "ok", id: userId }); 
        console.log(`User ${name} logged in with ID ${userId}`);
    } else {
        res.json({ status: "no" }); 
        console.log(`Wrong password for user ${name}`);
    }
});


core.post("/api/create-room", async (req, res) => {
    try {
        const { idRoom, user1, user2 } = req.body;

        if (!idRoom || !user1 || !user2) {
            return res.status(400).json({ status: "error", message: "Неверные данные" });
        }

        const rooms = await openROOMS();
        const users = await openUSERS();

        const u1 = String(user1);
        const u2 = String(user2);

        if (!(u1 in users) || !(u2 in users)) {
            return res.status(404).json({ status: "error", message: "Пользователь не найден" });
        }

        if (idRoom in rooms) {
            return res.json({ status: "exists", message: "Комната уже существует" });
        }

        
        rooms[idRoom] = { user1: u1, user2: u2, messages: [] };
        await saveROOMS(rooms);

        
        users[u1].rooms = Array.isArray(users[u1].rooms) ? users[u1].rooms : [];
        if (!users[u1].rooms.includes(idRoom)) users[u1].rooms.push(idRoom);

        users[u2].rooms = Array.isArray(users[u2].rooms) ? users[u2].rooms : [];
        if (!users[u2].rooms.includes(idRoom)) users[u2].rooms.push(idRoom);

        await saveUSERS(users);

        console.log("NEW ROOM", idRoom);
        res.json({ status: "ok", message: "Комната создана" });

    } catch (err) {
        console.error("Ошибка при создании комнаты:", err);
        res.status(500).json({ status: "error", message: "Ошибка сервера" });
    }
});

core.post("/api/set-online", async(req, res) => {
    data = req.body
    users = await openUSERS()

    users[data].statusNetwork = true
    res.json({"status":"ok"})
})

core.post("/api/set-ofline", async (req, res) => {
    data = req.body
    users = await openUSERS()

    users[data].statusNetwork = false
    res.json({ "status": "ok" })
})

core.post("/api/get-all-message", async (req, res) => {
    data = req.body
    messages = await openROOMS()

    res.json({messages: messages})
})

core.post("/api/create-groups", async (req, res) => {
    data = req.body

    newGroup = new Group(data.id, data.users);
    await newGroup.createGroup();

    
    res.json({ status: "ok", id: data.id });

})

core.post("/api/upgrade-to-owner", async (req, res) => {
    data = req.body

    groups = await openGROUPS()

    groups[data.idGroup].owners.push(data.idUser)

    await saveGROUPS(data);
});

core.post("/api/minus-owner", async (req, res) => {
    data = req.body

    groups = await openGROUPS()

    groups[data.idGroup].owners = groups[data.idGroup].owners.filter(owner => owner !== data.idUser);

    await saveGROUPS(data);
});


core.post("/api/blocked-user", async (req, res) => {
    data = req.body
    const users = await openUSERS();

    if (!users[data.userID].includes(data.blockedUser)) this.blockedUser.push(data.blockUser);
    users[data.id].blockedUser = data.blockedUser;
    await saveUSERS(users);

    res.json({message:"ok"})
})

core.post("/api/unblocked-user", async (req,res) => {
    data = req.body

    const users = await openUSERS();

    users[data.userID].blockedUser = data[data.userID].blockedUser.filter(user => user !== data.userBlocked);
    await saveUSERS(users);

    res.json({message:"ok"})
})


core.post("/api/create-channel", async (req,res) => {

})

//ENDPOINTS

core.listen(PORT, () => { console.log(`https:localhost:${PORT}`) })
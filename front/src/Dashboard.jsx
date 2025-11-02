import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const WS_URL = "ws://localhost:8080";
const API_URL = "http://localhost:3000/api";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, userName } = location.state || {};

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [otherUserIdOrRoom, setOtherUserIdOrRoom] = useState("");
  const [rooms, setRooms] = useState([]);
  const ws = useRef(null);

  // Подключение WebSocket один раз
  useEffect(() => {
    if (!userId || !userName) {
      navigate("/");
      return;
    }

    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: "login", userID: userId, name: userName }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "message" && data.roomId === roomId) {
        setMessages((prev) => [...prev, { from: data.from, text: data.text }]);
      }

      if (data.type === "updateRooms") {
        setRooms(data.rooms);
      }
    };

    ws.current.onclose = () => console.log("Disconnected from WebSocket");

    return () => ws.current?.close();
  }, [userId, userName, roomId, navigate]);

  // Отправка сообщения
  const sendMessage = () => {
    if (!text || !roomId) return;
    ws.current.send(JSON.stringify({ type: "message", from: userId, roomsID: roomId, text }));
    setMessages((prev) => [...prev, { from: userId, text }]);
    setText("");
  };

  // Создание или присоединение к комнате
  const createOrJoinRoom = async () => {
    if (!otherUserIdOrRoom.trim()) return alert("Введите ID комнаты или пользователя");

    let newRoomId = otherUserIdOrRoom.trim();

    // Если ввели только ID пользователя, создаем ID комнаты формата "user1_user2"
    if (!newRoomId.includes("_")) {
      newRoomId = `${userId}_${newRoomId}`;
    }

    try {
      const res = await fetch(`${API_URL}/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idRoom: newRoomId, user1: userId, user2: otherUserIdOrRoom.trim() }),
      });

      const data = await res.json();

      if (data.status === "ok" || data.status === "exists") {
        // Добавляем комнату локально
        setRooms((prev) => [...new Set([...prev, newRoomId])]);
        setRoomId(newRoomId);
        setOtherUserIdOrRoom("");

        // Запрашиваем обновление комнат у сервера через WS
        ws.current.send(JSON.stringify({ type: "updateRooms", userID: userId }));
      } else {
        alert("Не удалось создать или присоединиться к комнате");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка соединения с сервером");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Комнаты</h2>
        <div className="flex-1 overflow-y-auto mb-4">
          {rooms.map((r) => (
            <button
              key={r}
              className={`w-full text-left p-2 rounded mb-1 ${
                roomId === r ? "bg-blue-500 text-white" : "hover:bg-gray-200"
              }`}
              onClick={() => {
                setRoomId(r);
                setMessages([]);
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="ID комнаты или пользователя"
            value={otherUserIdOrRoom}
            onChange={(e) => setOtherUserIdOrRoom(e.target.value)}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={createOrJoinRoom}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Создать / Присоединиться
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-2 ${msg.from === userId ? "text-right" : "text-left"}`}>
              <span
                className={`inline-block p-2 rounded ${
                  msg.from === userId ? "bg-blue-500 text-white" : "bg-gray-300"
                }`}
              >
                {msg.from === userId ? "Вы: " : `${msg.from}: `}
                {msg.text}
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 flex gap-2 border-t bg-white">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Введите сообщение..."
            className="flex-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

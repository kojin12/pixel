import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Dashboard.css";

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
  const roomIdRef = useRef(null);

  useEffect(() => {
    if (!userId || !userName) {
      navigate("/");
      return;
    }

    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: "login", userID: userId, name: userName }));
      ws.current.send(JSON.stringify({ type: "updateRooms", userID: userId }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "message") {
        setMessages((prev) => {
          if (data.roomId === roomIdRef.current) {
            return [...prev, { from: data.from, text: data.text }];
          }
          return prev;
        });
      }

      if (data.type === "updateRooms") {
        setRooms(data.rooms);
      }
    };

    ws.current.onclose = () => console.log("🔌 WebSocket закрыт");

    return () => ws.current?.close();
  }, [userId, userName, navigate]);

  useEffect(() => {
    roomIdRef.current = roomId;

    // Получаем историю сообщений при смене комнаты
    const fetchMessages = async () => {
      if (!roomId) return;
      try {
        const res = await fetch(`${API_URL}/get-all-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idRoom: roomId }),
        });
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error("Ошибка загрузки истории сообщений:", err);
      }
    };

    fetchMessages();
  }, [roomId]);

  const sendMessage = () => {
    if (!text || !roomId || ws.current.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ type: "message", from: userId, roomsID: roomId, text }));
    setMessages((prev) => [...prev, { from: userId, text }]);
    setText("");
  };

  const createOrJoinRoom = async () => {
    if (!otherUserIdOrRoom.trim()) return alert("Введите ID комнаты или пользователя");
    let newRoomId = otherUserIdOrRoom.trim();
    if (!newRoomId.includes("_")) newRoomId = `${userId}_${newRoomId}`;

    try {
      const res = await fetch(`${API_URL}/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idRoom: newRoomId, user1: userId, user2: otherUserIdOrRoom.trim() }),
      });

      const data = await res.json();

      if (data.status === "ok" || data.status === "exists") {
        setRooms((prev) => [...new Set([...prev, newRoomId])]);
        setRoomId(newRoomId);
        setOtherUserIdOrRoom("");
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
    <div className="dashboard">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Чаты</h2>
        </div>

        <div className="room-list">
          {rooms.length === 0 ? (
            <p className="no-rooms">Нет чатов</p>
          ) : (
            rooms.map((r) => (
              <div
                key={r}
                className={`room-item ${roomId === r ? "active" : ""}`}
                onClick={() => setRoomId(r)}
              >
                <div className="room-avatar">{r[0].toUpperCase()}</div>
                <div className="room-info">
                  <p className="room-name">{r}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="room-input">
          <input
            type="text"
            placeholder="ID комнаты или пользователя"
            value={otherUserIdOrRoom}
            onChange={(e) => setOtherUserIdOrRoom(e.target.value)}
          />
          <button onClick={createOrJoinRoom}>+</button>
        </div>
      </div>

      <div className="chat-area">
        {roomId ? (
          <>
            <div className="chat-header">
              <h3>{roomId}</h3>
            </div>
            <div className="messages">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message ${msg.from === userId ? "own" : "other"}`}
                >
                  <span className="text">{msg.text}</span>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                placeholder="Введите сообщение..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Отправить</button>
            </div>
          </>
        ) : (
          <div className="chat-placeholder">
            <p>Выберите чат слева или создайте новый</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

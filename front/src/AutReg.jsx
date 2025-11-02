import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './AutReg.css';

const API_URL = "http://localhost:3000/api";

const AutReg = () => {
    const [isRegister, setIsRegister] = useState(true);
    const [nick, setNick] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async () => {
        const trimmedNick = nick.trim();
        const trimmedPassword = password.trim();

        if (!trimmedNick || !trimmedPassword) {
            alert("Введите ник и пароль");
            return;
        }

        try {
            if (isRegister) {
                // Регистрация
                const res = await fetch(`${API_URL}/createUser`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: trimmedNick, password: trimmedPassword })
                });
                const data = await res.json();

                if (data.status === "ok") {
                    setNick("");
                    setPassword("");
                    navigate("/dashboard", { state: { userId: data.id, userName: trimmedNick } });
                } else {
                    alert(data.message || "Ошибка регистрации");
                }
            } else {
                // Авторизация
                const res = await fetch(`${API_URL}/authoruzation`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: trimmedNick, password: trimmedPassword })
                });
                const data = await res.json();

                if (data.status === "ok") {
                    setNick("");
                    setPassword("");
                    navigate("/dashboard", { state: { userId: data.id, userName: trimmedNick } });
                } else if (data.status === "no") {
                    alert("Неверный пароль");
                } else {
                    alert("Пользователь не найден");
                }
            }
        } catch (err) {
            console.error(err);
            alert("Ошибка соединения с сервером");
        }
    };

    return (
        <div className="MainScreen">
            <div className="text">
                <h2 className="mainText">Welcome To Pixel</h2>
            </div>

            <div className="formAut">
                <h3>{isRegister ? "Создать аккаунт" : "Вход"}</h3>

                <div className="Inputes">
                    <input
                        type="text"
                        placeholder="Введите ник"
                        value={nick}
                        onChange={(e) => setNick(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button className="check" onClick={handleSubmit}>
                    {isRegister ? "Создать" : "Войти"}
                </button>

                <div className="toggleAuth">
                    <span>
                        {isRegister ? "Уже есть аккаунт? " : "Нет аккаунта? "}
                    </span>
                    <button
                        className="toggleBtn"
                        onClick={() => setIsRegister(!isRegister)}
                    >
                        {isRegister ? "Войти" : "Регистрация"}
                    </button>
                </div>
            </div>

            <div className="Circle"></div>
        </div>
    );
}

export default AutReg;

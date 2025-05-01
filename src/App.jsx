import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { initializeWebSocket } from "./components/WebsocketConnection";

function App() {
  const [stage, setStage] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken]       = useState(localStorage.getItem("token"));
  const [ws, setWs]             = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);

  const doAuth = async (path) => {
    const res  = await fetch(`http://localhost:8000/${path}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setStage("chat");
    } else {
      alert(data.error);
    }
  };

  useEffect(() => {
    if (stage === "chat") {
      const socket = initializeWebSocket(
        "ws://localhost:8000/ws",
        setOnlineCount,
        msg => setMessages(ms => [...ms, msg]),
        setConnected
      );
      setWs(socket);
    }
  }, [stage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() && connected) {
      ws.send(JSON.stringify({ message: input }));
      setInput("");
    }
  };

  if (stage === "login") {
    return (
      <div className="login-container">
        <h2>Login / Register</h2>
        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <div className="btn-group">
          <button onClick={() => doAuth("login")}>Login</button>
          <button onClick={() => doAuth("register")}>Register</button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header>
        <h1>Lumera Chat</h1>
        <p>Users online: {onlineCount}</p>
      </header>

      <div className="messages-container">
        {messages.map((m,i) => (
          <div key={i} className="message">
            <strong>{m.username}:</strong> {m.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          disabled={!connected}
        />
        <button onClick={sendMessage} disabled={!connected}>Send</button>
      </div>
    </div>
  );
}

export default App;

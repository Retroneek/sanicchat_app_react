import React, { useEffect, useState } from "react";
import './App.css';
import { initializeWebSocket } from "./components/WebsocketConnection";

const App = () => {
  const [users_connected, setUsersConnected] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const websocket = initializeWebSocket(
      "ws://localhost:8000/ws",
      (users_connected) => setUsersConnected(users_connected),
      (message) => setMessages((prevMessages) => [...prevMessages, message]),
      (status) => setIsConnected(status)
    );

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const sendMessage = () => {
    if (input.trim() && isConnected) {
      ws.send(input);
      setInput("");
    }
  };

  return (
    <div>
      <h1>Lumera</h1>
      <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>
      <p>Users connected: {users_connected}</p>
      <div>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message"
        disabled={!isConnected}
      />
      <button onClick={sendMessage} disabled={!isConnected}>
        Send
      </button>
    </div>
  );
};

export default App;

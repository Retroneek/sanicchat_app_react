import React, { useEffect, useState, useRef } from "react";
import './App.css';
import { initializeWebSocket, clientName } from "./components/WebsocketConnection";

const App = () => {
  const [usersConnected, setUsersConnected] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const websocket = initializeWebSocket(
      "ws://localhost:8000/ws",
      count => setUsersConnected(count),
      message => setMessages(prev => [...prev, message]),
      status => setIsConnected(status)
    );
    setWs(websocket);
    return () => websocket.close();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() && isConnected) {
      const payload = JSON.stringify({ username: clientName, message: input });
      ws.send(payload);
      setInput("");
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Lumera</h1>
        <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>
        <p>Users connected: {usersConnected}</p>
      </header>
      <div className="messages-container">
        <ul>
          {messages.map((msg, i) => (
            <li key={i}>{typeof msg === 'object' ? `${msg.username}: ${msg.message}` : msg}</li>
          ))}
          <div ref={messagesEndRef} />
        </ul>
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          placeholder="Type a message and press Enter"
          disabled={!isConnected}
        />
        <button onClick={sendMessage} disabled={!isConnected}>Send</button>
      </div>
    </div>
  );
};

export default App;
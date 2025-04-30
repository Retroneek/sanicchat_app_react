export let clientName;

export const initializeWebSocket = (url, onUserCountUpdate, onMessage, onConnectionStatus) => {
  if (!clientName) {
    clientName = prompt("Enter your username:");
  }
  const clientInfo = { username: clientName, id: Date.now() };

  fetch("http://localhost:8000/get_users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clientInfo),
  });

  const ws = new WebSocket(url);

  ws.onopen = () => onConnectionStatus(true);

  ws.onmessage = ({ data }) => {
    if (data.startsWith("USERS_UPDATE:")) {
      const count = parseInt(data.split(":")[1].trim(), 10);
      onUserCountUpdate(count);

    } else if (data.startsWith("MESSAGE_HISTORY:")) {
      const jsonStr = data.slice("MESSAGE_HISTORY:".length);
      try {
        const history = JSON.parse(jsonStr);
        history.forEach(msg => onMessage(msg));
      } catch (e) {
        console.error("Failed to parse message history", e);
      }

    } else {
      try {
        const parsed = JSON.parse(data);
        if (parsed.username && parsed.message) {
          onMessage(parsed);
          return;
        }
      } catch {}
      onMessage(data);
    }
  };

  ws.onclose = () => onConnectionStatus(false);
  ws.onerror = err => console.error("WebSocket error", err);

  return ws;
};
var client_name = prompt("Username:");
var client_id = Date.now();

const client_json_data = {
  username: client_name,
  id: client_id,
};

fetch("http://localhost:8000/get_users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(client_json_data),
});

export const initializeWebSocket = (url, onUserCountUpdate, onMessage, onConnectionStatus) => {
  const websocket = new WebSocket(url);

  websocket.onopen = () => {
    console.log("Connected to WebSocket server");
    if (onConnectionStatus) onConnectionStatus(true);
  };

  websocket.onmessage = (event) => {
    console.log("Message received:", event.data);

    if (event.data.startsWith("USERS_UPDATE:")) {
      const count = parseInt(event.data.split(":")[1].trim(), 10);
      if (onUserCountUpdate) onUserCountUpdate(count);
    } 

    else if (event.data.startsWith("MESSAGE_HISTORY:")) {
      const history = JSON.parse(event.data.split(":")[1].trim());
      history.forEach((msg) => {
        if (onMessage) onMessage(msg);
      });
    } 

    else {
      if (onMessage) onMessage(event.data);
    }
  };

  websocket.onclose = () => {
    console.log("WebSocket connection closed");
    if (onConnectionStatus) onConnectionStatus(false);
  };

  websocket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return websocket;
};
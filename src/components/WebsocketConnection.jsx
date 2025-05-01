export let token;

export function initializeWebSocket(baseUrl, onUserCount, onMessage, onStatus) {
  token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const ws = new WebSocket(`${baseUrl}?token=${token}`);
  ws.onopen    = () => onStatus(true);
  ws.onclose   = () => onStatus(false);
  ws.onerror   = e => console.error("WebSocket error", e);
  ws.onmessage = ({ data }) => {
    if (data.startsWith("USERS_UPDATE:")) {
      onUserCount(parseInt(data.split(":")[1], 10));
    } else if (data.startsWith("MESSAGE_HISTORY:")) {
      JSON.parse(data.slice(16)).forEach(msg => onMessage(msg));
    } else if (data.startsWith("CHAT_MESSAGE:")) {
      onMessage(JSON.parse(data.slice(13)));
    }
  };
  return ws;
}

import Elysia from "elysia";

const chat = new Elysia({ prefix: "/chat" }).ws("/ws", {
  message(ws, message) {
    console.log("message", message);
    ws.send(message);
  },
});

export default chat;

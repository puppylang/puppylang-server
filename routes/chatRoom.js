import Elysia from "elysia";
import Chat from "../controllers/chat";

const openSockets = {};

const sendMessage = async (time, message) => {
  const { chat_id, user_id } = message;
  const createdMessage = await Chat.createMessage({
    message: {
      ...message,
      time,
      user_id,
      chat_id: Number(chat_id),
    },
  });

  await openSockets[chat_id].forEach((ws) => {
    ws.send({
      type: "MESSAGE",
      data: createdMessage,
    });
  });
};

const readMessage = async (messageId, chatId, userId) => {
  Chat.updateReadMessage(Number(messageId));

  openSockets[chatId].forEach((ws) => {
    ws.send({
      type: "READ",
      data: {
        id: messageId,
        chat_id: chatId,
        user_id: userId,
      },
    });
  });
};

const chat = new Elysia({ prefix: "/chat" }) //
  .get("", Chat.getChattings)
  .post("", Chat.createChatRoom)
  .get("/message/:id", Chat.getMessages)
  .get("/post/:id", Chat.getDetailPostPet)
  .get("/message/:id", Chat.getMessages)
  .patch("/message/read", Chat.updateReadMessage)
  // .get("/sse", Chat.getNotReadedMessage)
  .ws("/ws", {
    open() {
      console.log("socket sever open!");
    },
    async message(ws, websocketData) {
      const time = new Date();

      const { data, type } = websocketData;

      if (type === "READ") {
        readMessage(data.id, data.chat_id);
      }
      if (type === "OPEN") {
        if (openSockets && openSockets[data.chat_id])
          openSockets[data.chat_id].push(ws);
        else openSockets[data.chat_id] = [ws];
      }

      if (type === "MESSAGE") {
        sendMessage(time, data);
      }
    },
  });

export default chat;

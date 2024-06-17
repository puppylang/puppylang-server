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

const chat = new Elysia() //
  .get("/chats", Chat.getChattings)
  .get("/chat", Chat.getChattingDetail)
  .post("/chat", Chat.createChatRoom)
  .get("/chat/message/:id", Chat.getMessages)
  .get("/chat/post/:id", Chat.getDetailPostPet)
  .get("/chat/message/:id", Chat.getMessages)
  .patch("/chat/message/read", Chat.updateReadMessage)
  .get("/chat/sse", Chat.getNotReadedMessage)
  .ws("/chat/ws", {
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

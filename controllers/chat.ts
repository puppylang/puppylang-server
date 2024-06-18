import { PrismaClient } from "@prisma/client";
import { Stream } from "@elysiajs/stream";
import type { IncomingHttpHeaders } from "http";

import type { CustomRequest, Params } from "../types/request";
import User from "./user";
import type { CreateMessageType } from "../types/chat";
import { CustomError } from "../utils/CustomError";
import user from "../routes/userRoute";

const prisma = new PrismaClient({});

interface ChatRequest {
  headers: IncomingHttpHeaders;
  method?: string;
  set?: {
    status?: number;
  };
  query: {
    offset?: string;
    direction?: "NEXT" | "PREVIOUS";
  };
  params?: {
    id: number;
  };
}

class Chat {
  static async getChattingDetail(request: CustomRequest<{ id: string }>) {
    const token = request.headers.authorization;
    if (!token) return;
    const user = await User.getUserInfo(token);
    if (!user) return;

    if (!request.query || !request.query.id) {
      return CustomError({
        status: 400,
        message: "Invalid request: Missing required type parameters.",
      });
    }

    const { id } = request.query;

    const chattingDetail = await prisma.chat.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          include: {
            blocker: true,
          },
        },
        guest: {
          include: {
            blocker: true,
          },
        },
      },
    });

    if (!chattingDetail) return;

    return {
      ...chattingDetail,
      is_author: chattingDetail.author_id === user.id,
    };
  }

  static async getChattings(
    request: CustomRequest<{ type: "GUEST" | "AUTHOR" }>
  ) {
    const token = request.headers.authorization;
    if (!token) return;
    const user = await User.getUserInfo(token);
    if (!user) return;

    if (!request.query || !request.query.type) {
      return CustomError({
        status: 400,
        message: "Invalid request: Missing required type parameters.",
      });
    }

    const { type } = request.query;

    const chattingRooms = await prisma.chat.findMany({
      include: {
        user: {
          select: {
            image: true,
            name: true,
          },
        },
        post: {
          select: { title: true, pet: true, preferred_walk_location: true },
        },
        guest: {
          select: {
            name: true,
            image: true,
          },
        },
        message: {
          select: {
            time: true,
            text: true,
            user_id: true,
            is_read: true,
          },
        },
      },
      where: {
        OR:
          type === "GUEST"
            ? [
                {
                  guest_id: user.id,
                },
              ]
            : [
                {
                  author_id: user.id,
                },
              ],
      },
    });

    const modifiedChatRooms = chattingRooms.map((chat) => {
      const { message, ...rest } = chat;

      const notReadedMessage = message.filter(
        (item) => item.user_id !== user.id && !item.is_read
      );

      return {
        ...rest,
        lastMessage: chat.message.at(-1),
        notReadedMessageCount: notReadedMessage.length,
      };
    });

    return modifiedChatRooms;
  }

  static async createMessage(message: CreateMessageType) {
    const { chat_id, text, time, user_id, other_user_id } = message;

    const otherUserInfo = await prisma.user.findUnique({
      where: {
        id: other_user_id,
      },
      include: {
        blocker: true,
      },
    });
    const isBlockedOther = Boolean(
      otherUserInfo?.blocker.find((blocker) => blocker.blocked_id === user_id)
    );

    const createdMessage = await prisma.message.create({
      data: {
        chat_id,
        text,
        time,
        user_id,
        is_blocked_other: isBlockedOther,
      },
    });

    return createdMessage;
  }

  static async getDetailPostPet(request: CustomRequest<Params>) {
    try {
      if (!request.params) return;

      const { id: post_id } = request.params;
      if (!post_id) {
        return CustomError({
          message: "Invalid request. ID is missing.",
          status: 404,
        });
      }

      const post = await prisma.post.findUnique({
        where: { id: Number(post_id) },
        include: { pet: true },
      });

      return post;
    } catch (err) {
      console.log(err);
    }
  }

  static async getMessages(request: ChatRequest) {
    if (!request.params) return;

    const { id: chat_id } = request.params;
    if (!chat_id) {
      return CustomError({
        message: "Invalid request. ID is missing.",
        status: 401,
      });
    }

    const hasNotOffset =
      (request.query.direction === "NEXT" ||
        request.query.direction === "PREVIOUS") &&
      !request.query.offset;

    if (hasNotOffset) {
      return CustomError({
        message: "Invalid request. Offset is missing.",
        status: 401,
      });
    }

    if (request.query.direction === "NEXT") {
      const { offset } = request.query;

      const nextMessages = await prisma.message.findMany({
        take: 20,
        where: {
          chat_id: Number(chat_id),
          id: {
            gt: Number(offset),
          },
        },
      });

      return nextMessages;
    }

    if (request.query.direction === "PREVIOUS") {
      const { offset } = request.query;

      const previousMessages = await prisma.message.findMany({
        take: 20,
        where: {
          chat_id: Number(chat_id),
          id: {
            lt: Number(offset),
          },
        },
        orderBy: { id: "desc" },
      });

      return previousMessages.reverse();
    }

    if (!request.query.offset && !request.query.direction) {
      const token = request.headers.authorization;
      if (!token) return;
      const user = await User.getUserInfo(token);
      if (!user) return;

      const firstNotReadedMessage = await prisma.message.findFirst({
        where: {
          chat_id: Number(chat_id),
          is_read: false,
          NOT: {
            user_id: user.id,
          },
        },
      });

      if (!firstNotReadedMessage) {
        const messages = await prisma.message.findMany({
          take: 20,
          where: {
            chat_id: Number(chat_id),
          },
          orderBy: {
            id: "desc",
          },
        });

        return messages.reverse();
      }

      const notReadedMessages = await prisma.message.findMany({
        where: {
          chat_id: Number(chat_id),
          id: {
            gte: firstNotReadedMessage.id,
          },
        },
        orderBy: {
          id: "asc",
        },
      });

      const readedMessage = await prisma.message.findMany({
        take: 15,
        where: {
          chat_id: Number(chat_id),
          id: {
            lt: firstNotReadedMessage.id,
          },
        },
        orderBy: {
          id: "desc",
        },
      });

      const messages = [...readedMessage.reverse(), ...notReadedMessages];

      return messages;
    }
  }

  static async createChatRoom(
    request: CustomRequest<{
      guest_id: string;
      author_id: string;
      post_id: string;
      guest_image?: string;
    }>
  ) {
    try {
      if (
        !request.body.post_id ||
        !request.body.author_id ||
        !request.body.guest_id
      ) {
        CustomError({ message: "데이터값이 유효하지 않습니다.", status: 400 });
      }

      const { post_id, author_id, guest_id, guest_image } = request.body;

      const sameUserChatRoom = await prisma.chat.findFirst({
        where: {
          author_id,
          guest_id,
        },
      });

      if (sameUserChatRoom) {
        return sameUserChatRoom.id;
      }

      const newChat = await prisma.chat.create({
        data: {
          author_id,
          guest_id,
          post_id: Number(post_id),
          guest_image,
        },
      });

      return newChat.id;
    } catch (err) {
      console.error(err);
    }
  }

  static async updateReadMessage(messageId: number) {
    try {
      await prisma.$queryRaw`UPDATE "Message" SET is_read = true where id IN (${messageId})`;
    } catch (err) {
      console.error(err);
    }
  }

  static async getNotReadedMessage(
    request: CustomRequest<{
      token: {
        value: string;
      };
    }>
  ) {
    if (!request.headers.authorization) {
      CustomError({
        message: "token이 존재하지 않습니다.",
        status: 400,
      });

      return;
    }

    const token = request.headers.authorization;
    if (!token) return;
    const user = await User.getUserInfo(token);
    if (!user) return;

    const stream = new Stream();

    const chatting = await prisma.chat.findMany({
      include: {
        message: true,
      },
      where: {
        OR: [
          {
            author_id: user.id,
          },
          {
            guest_id: user.id,
          },
        ],
      },
    });

    if (chatting.length) return;

    const notReadedChatting = chatting.find((chat) => {
      const notReadedMessage = chat.message.filter(
        (item) => item.user_id !== user.id && !item.is_read
      );

      return Boolean(notReadedMessage.length);
    });

    if (!notReadedChatting) return;

    stream.send("Exist notReadedMessage");

    return stream;
  }
}

export default Chat;

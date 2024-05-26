import { PrismaClient } from "@prisma/client";

import { CustomError } from "../utils/CustomError";

import { type CustomRequest, type Params } from "../types/request";
import User from "./user";

const prisma = new PrismaClient({});

class Like {
  static async createLike(request: CustomRequest<Params>) {
    try {
      if (!request.params) return;

      const { id: post_id } = request.params;

      if (!post_id) {
        return CustomError({
          message: "Invalid request. ID is missing.",
          status: 404,
        });
      }

      const token = request.headers.authorization;
      if (!token) return;

      const user = await User.getUserInfo(token);

      if (!user) {
        return CustomError({
          message: "가입되어 있지 않은 사용자입니다.",
          status: 401,
        });
      }

      const hasLike = Boolean(
        await prisma.like.count({
          where: { author_id: user?.id, post_id: Number(post_id) },
        })
      );

      if (hasLike) {
        return CustomError({
          message: "좋아요 데이터가 중복됩니다.",
          status: 409,
        });
      }

      return await prisma.like.create({
        data: {
          author_id: user?.id,
          post_id: Number(post_id),
        },
      });
    } catch (err) {
      console.log(err);
    }
  }

  static async deleteLike(request: CustomRequest<Params>) {
    try {
      if (!request.params) return;

      const { id: post_id } = request.params;

      if (!post_id) {
        return CustomError({
          message: "Invalid request. ID is missing.",
          status: 404,
        });
      }

      const token = request.headers.authorization;

      if (!token) return;

      const user = await User.getUserInfo(token);

      if (!user) {
        return CustomError({
          message: "가입되어 있지 않은 사용자입니다.",
          status: 401,
        });
      }

      const hasLike = Boolean(
        await prisma.like.count({
          where: { author_id: user?.id, post_id: Number(post_id) },
        })
      );

      if (!hasLike) {
        return CustomError({
          message: "해당 유저로 좋아요 데이터가 존재하지 않습니다.",
          status: 404,
        });
      }

      return await prisma.like.deleteMany({
        where: {
          author_id: user?.id,
          post_id: Number(post_id),
        },
      });
    } catch (err) {
      console.log(err);
    }
  }
}

export default Like;

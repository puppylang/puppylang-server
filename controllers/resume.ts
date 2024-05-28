import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import type { CustomRequest } from "../types/request";
import type { CreateResumeReqType } from "../types/resumeType";
import User from "./user";
import type { DatabaseErrorType } from "../types/userType";
import { CustomError } from "../utils/CustomError";
import type { UpdateResumeReqType } from "../types/resumeType";

const prisma = new PrismaClient({});

class Resume {
  static async createResume(request: CustomRequest<CreateResumeReqType>) {
    try {
      const token = request.headers.authorization;
      if (!token) return;
      const user = await User.getUserInfo(token);
      if (!user) return;

      const newResume = await prisma.resume.create({ data: request.body });
      if (newResume) {
        request.set.status = 201;
      }
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        const code = err.code;
        const FOREIGN_KEY_ERROR_CODE = "P2003";
        if (code !== FOREIGN_KEY_ERROR_CODE) return;
        const error: DatabaseErrorType = new Error("good");
        error.status = 409;
        error.message = "Invalid user_id";
        throw error;
      }
    }
  }

  static async getResumes(request: CustomRequest<{ postId: string }>) {
    try {
      const token = request.headers.authorization;
      if (!token) return;
      const user = await User.getUserInfo(token);
      if (!user) return;

      if (!request.query || !request.query.postId) {
        CustomError({ message: "id가 존재하지 않습니다.", status: 401 });
        return;
      }
      const { postId } = request.query;

      const resumes = await prisma.resume.findMany({
        where: { post_id: Number(postId) },
      });

      return resumes;
    } catch (err) {
      console.error(err);
    }
  }

  static async updateResume(request: CustomRequest<UpdateResumeReqType>) {
    try {
      const updatedResume = await prisma.resume.update({
        where: {
          id: request.body.id,
        },
        data: request.body,
      });

      if (updatedResume) {
        request.set.status = 201;
      }
    } catch (err) {
      console.error(err);
      if (err instanceof PrismaClientKnownRequestError) {
        const code = err.code;
        if (code !== "P2025") return;
        const error: DatabaseErrorType = new Error("Invalid 'id'");
        error.status = 401;
        throw error;
      }
    }
  }
}

export default Resume;

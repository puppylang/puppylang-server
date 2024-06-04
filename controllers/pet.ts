import { PrismaClient } from "@prisma/client";
import type {
  CreatePetFormReqType,
  DeletePetReqType,
  ReadPetsReqType,
  UpdatePetReqType,
} from "../types/petType";
import type { CustomRequest } from "../types/request";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import type { DatabaseErrorType } from "../types/userType";
import { CustomError } from "../utils/CustomError";
import User from "./user";

const prisma = new PrismaClient({});

interface RawQueryCount {
  count: {
    result: number;
  };
}

export default class Pet {
  static async createPet(request: CustomRequest<CreatePetFormReqType>) {
    try {
      const token = request.headers.authorization;
      if (!token) return;
      const user = await User.getUserInfo(token);
      if (!user) return;
      const result: RawQueryCount[] =
        await prisma.$queryRaw`SELECT COUNT(*) FROM "Pet" WHERE user_id = ${user.id}`;

      const resultCount = Number(result[0].count);
      if (resultCount >= 3) {
        return CustomError({
          status: 400,
          message: "최대 2개의 펫을 만들 수 있습니다.",
        });
      }

      const newPet = await prisma.pet.create({ data: request.body });

      if (newPet && request.set) {
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

  static async getPets(request: CustomRequest<ReadPetsReqType>) {
    try {
      const token = request.headers.authorization;
      if (!token) return;
      const user = await User.getUserInfo(token);
      if (!user) return;

      if (request.query && request.query.user_id) {
        const { user_id } = request.query;
        const pets = await prisma.pet.findMany({ where: { user_id } });

        return pets;
      }

      const pets = await prisma.pet.findMany({
        where: {
          user_id: user.id,
        },
      });

      return pets;
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        const code = err.code;
        const FOREIGN_KEY_ERROR_CODE = "P2003";
        if (code !== FOREIGN_KEY_ERROR_CODE) return;
        const error: DatabaseErrorType = new Error("good");
        error.status = 409;
        error.message = "Invalid 'user_id'";
        throw error;
      }
    }
  }

  static async deletePet(request: CustomRequest<DeletePetReqType>) {
    try {
      const { id } = request.body;
      const deletedPet = await prisma.pet.delete({
        where: {
          id: Number(id),
        },
      });

      if (deletedPet) {
        request.set.status = 201;
      }
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        const code = err.code;
        if (code !== "P2025") return;
        const error: DatabaseErrorType = new Error("Invalid 'id'");
        error.status = 401;
        throw error;
      }
    }
  }

  static async updatePet(request: CustomRequest<UpdatePetReqType>) {
    try {
      const updatedPet = await prisma.pet.update({
        where: {
          id: request.body.id,
        },
        data: request.body,
      });

      if (updatedPet) {
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

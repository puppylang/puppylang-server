import { PrismaClient } from "@prisma/client";
import type { CustomRequest, Params } from "../types/request";
import { WalkRole, type PetWalkForm } from "../types/walkType";
import { CustomError } from "../utils/CustomError";
import User from "./user";

const prisma = new PrismaClient({});

interface RecordWalkRoleQuery {
  role: WalkRole;
}

interface RecordWalkQuery extends RecordWalkRoleQuery {
  from: string;
  to: string;
}

export default class Walk {
  static async createPetWalk(request: CustomRequest<PetWalkForm>) {
    try {
      const token = request.headers.authorization;
      if (!token) {
        return CustomError({
          message: "산책 기록은 로그인 후 가능합니다.",
          status: 401,
        });
      }

      const user = await User.getUserInfo(token);
      if (!user) {
        return CustomError({
          message: "가입되어 있지 않은 사용자입니다.",
          status: 401,
        });
      }

      const { start_at, end_at, locations, distance, pet_id } = request.body;

      if (!pet_id) {
        return CustomError({
          message: "산책을 기록할 펫의 id값은 필수입니다.",
          status: 401,
        });
      }

      const createdPetWalkRecord = await prisma.petWalkRecord.create({
        data: {
          start_at,
          end_at,
          distance,
          pet_id,
          user_id: user.id,
          locations: { create: locations },
        },
        include: { locations: true, pet: true },
      });

      if (createdPetWalkRecord) {
        const { locations: target } = createdPetWalkRecord;
        const formattedLocations = target.map((location) => ({
          ...location,
          latitude: location.latitude.toNumber(),
          longitude: location.longitude.toNumber(),
        }));

        return new Response(
          JSON.stringify({
            ...createdPetWalkRecord,
            locations: formattedLocations,
          })
        );
      }
    } catch (err) {
      console.log(err, "ERROR");
      return CustomError({ message: "error", status: 500 });
    }
  }

  static async createPetSitterWalk(request: CustomRequest<PetWalkForm>) {
    try {
      const token = request.headers.authorization;
      if (!token) {
        return CustomError({
          message: "게시글은 로그인 후 작성이 가능합니다.",
          status: 401,
        });
      }

      const user = await User.getUserInfo(token);
      if (!user) {
        return CustomError({
          message: "가입되어 있지 않은 사용자입니다.",
          status: 401,
        });
      }
    } catch (err) {
      console.log(err);
    }
  }

  static async getRecordWalks(request: CustomRequest<RecordWalkQuery>) {
    try {
      const token = request.headers.authorization;

      if (!token) {
        return CustomError({
          message: "산책 일지는 로그인 후 확인 가능합니다.",
          status: 401,
        });
      }

      const user = await User.getUserInfo(token);
      if (!user) {
        return CustomError({
          message: "가입되어 있지 않은 사용자입니다.",
          status: 401,
        });
      }

      if (!request.query?.from || !request.query.to || !request.query.role) {
        return CustomError({
          message: "Invalid request: Missing required query parameters.",
          status: 400,
        });
      }

      const { from, to, role } = request.query;

      if (role === WalkRole.PetOwner) {
        const recordedPetWalks = await prisma.petWalkRecord.findMany({
          where: {
            user_id: user.id,
            AND: [{ start_at: { gte: from } }, { end_at: { lte: to } }],
          },
          include: { locations: true, pet: true },
        });

        return new Response(JSON.stringify(recordedPetWalks));
      }

      if (role === WalkRole.PetSitterWalker) {
        const recordedPetSitterWalks =
          await prisma.petSitterWalkRecord.findMany({
            where: {
              user_id: user.id,
              AND: [{ start_at: { gte: from } }, { end_at: { lte: to } }],
            },
            include: { locations: true, pet: true },
          });

        return new Response(JSON.stringify(recordedPetSitterWalks));
      }
    } catch (err) {
      console.log(err);
    }
  }

  static async getDetailRecordWalk(
    request: CustomRequest<RecordWalkRoleQuery & Params>
  ) {
    try {
      const token = request.headers.authorization;
      if (!token) {
        return CustomError({
          message: "산책 일지는 로그인 후 확인 가능합니다.",
          status: 401,
        });
      }

      const user = await User.getUserInfo(token);
      if (!user) {
        return CustomError({
          message: "가입되어 있지 않은 사용자입니다.",
          status: 401,
        });
      }

      if (!request.params?.id || !request.query?.role) {
        return CustomError({
          message: "Invalid request: Missing required query parameters.",
          status: 400,
        });
      }

      const { id: walkId } = request.params;
      const { role: walkRole } = request.query;

      if (walkRole === WalkRole.PetOwner) {
        const recordWalk = await prisma.petWalkRecord.findUnique({
          where: { id: Number(walkId) },
          include: { locations: true, pet: true },
        });

        if (recordWalk) {
          const { locations: target } = recordWalk;
          const formattedLocations = target.map((location) => ({
            ...location,
            latitude: location.latitude.toNumber(),
            longitude: location.longitude.toNumber(),
          }));

          return new Response(
            JSON.stringify({
              ...recordWalk,
              locations: formattedLocations,
            })
          );
        }
      }

      if (walkRole === WalkRole.PetSitterWalker) {
        const recordWalk = await prisma.petSitterWalkRecord.findUnique({
          where: { id: Number(walkId) },
          include: { locations: true, pet: true },
        });

        if (recordWalk) {
          const { locations: target } = recordWalk;
          const formattedLocations = target.map((location) => ({
            ...location,
            latitude: location.latitude.toNumber(),
            longitude: location.longitude.toNumber(),
          }));

          return new Response(
            JSON.stringify({
              ...recordWalk,
              locations: formattedLocations,
            })
          );
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
}

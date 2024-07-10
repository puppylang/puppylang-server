import { PrismaClient } from "@prisma/client";
import { getLocalInfo, getLocalInfoWithGeo } from "../services/regionService";
import type { UserRegionReqType } from "../types/region";
import type { CustomRequest } from "../types/request";
import User from "./user";
import { CustomError } from "../utils/CustomError";

const prisma = new PrismaClient({});

class Region {
  static async getRegionInfo(request: CustomRequest<UserRegionReqType>) {
    if (!request.query) return;
    if (request.query.text) {
      const text = request.query.text || "";
      const data = await getLocalInfo(text);
      return {
        status: data?.status,
        regions: data?.regions || [],
      };
    }

    if (request.query.x && request.query.y) {
      const { x, y } = request.query;
      const data = await getLocalInfoWithGeo({ x, y });
      return {
        stauts: data.status,
        regions: data.regions || [],
      };
    }
  }

  static async createRegion(request: CustomRequest<{ region: string }>) {
    const token = request.headers.authorization;
    if (!token) return;
    const user = await User.getUserInfo(token);
    if (!user) return;

    const regions = await prisma.region.count({
      where: {
        user_id: user.id,
      },
    });

    if (regions >= 2) {
      return CustomError({
        message: "최대 2개의 지역을 등록할 수 있습니다.",
        status: 400,
      });
    }

    const { region } = request.body;

    const newRegion = await prisma.region.create({
      data: { region, user_id: user.id },
    });
    await prisma.activedRegion.upsert({
      where: {
        user_id: user.id,
      },
      update: {
        region_id: newRegion.id,
      },
      create: {
        user_id: user.id,
        region_id: newRegion.id,
      },
    });

    return newRegion;
  }

  static async deleteRegion(request: CustomRequest<{ id: string }>) {
    const token = request.headers.authorization;
    if (!token) return;
    const user = await User.getUserInfo(token);
    if (!user) return;

    const { id: regionId } = request.body;

    const deletedUserRegion = await prisma.region.delete({
      where: {
        id: Number(regionId),
      },
    });

    if (deletedUserRegion) {
      request.set.status = 200;
    }
  }

  static async updateUserActivedRegion(
    request: CustomRequest<{ region_id: string }>
  ) {
    const token = request.headers.authorization;
    if (!token) {
      return CustomError({
        message: "로그인 후 확인 가능합니다.",
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

    if (!request.body || !request.body.region_id) {
      return CustomError({
        message: "데이터가 존재하지 않습니다.",
        status: 401,
      });
    }

    const { region_id } = request.body;
    const numberRegionId = Number(region_id);

    try {
      const updatedAtiveRegion = await prisma.activedRegion.upsert({
        where: {
          user_id: user.id,
        },
        update: {
          region_id: numberRegionId,
          user_id: user.id,
        },
        create: {
          region_id: numberRegionId,
          user_id: user.id,
        },
      });

      return updatedAtiveRegion;
    } catch (err) {
      console.log(err);
    }
  }

  static async getActivedRegion(request: CustomRequest<string>) {
    const token = request.headers.authorization;
    if (!token) return;
    const user = await User.getUserInfo(token);
    if (!user) return;

    const activedRegion = await prisma.activedRegion.findUnique({
      where: {
        user_id: user.id,
      },
    });

    return activedRegion;
  }

  static async getRegion(request: CustomRequest<string>) {
    const token = request.headers.authorization;
    if (!token) return;
    const user = await User.getUserInfo(token);
    if (!user) return;

    const regions = await prisma.region.findMany({
      where: {
        user_id: user.id,
      },
    });

    return regions;
  }
}

export default Region;

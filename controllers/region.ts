import { PrismaClient } from "@prisma/client";
import { getLocalInfo, getLocalInfoWithGeo } from "../services/kakaoRegion";
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
      if (!data) return;
      const { documents } = data;
      return documents;
    }

    if (request.query.x && request.query.y) {
      const { x, y } = request.query;
      const { documents } = await getLocalInfoWithGeo({ x, y });
      return documents.map((document) => ({
        address: null,
        road_address: null,
        address_name: document.address_name,
        x: String(document.x),
        y: String(document.y),
      }));
    }
  }

  static async createRegion(request: CustomRequest<{ region: string }>) {
    const token = request.headers.authorization;
    if (!token) return;
    const user = await User.getUserInfo(token);
    if (!user) return;

    if (user.region.length >= 2) {
      return CustomError({
        message: "최대 2개의 지역을 등록할 수 있습니다.",
        status: 400,
      });
    }

    const { region } = request.body;

    const newRegion = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        region: {
          push: region,
        },
      },
    });

    if (newRegion) {
      request.set.status = 201;
    }
  }

  static async deleteRegion(request: CustomRequest<{ region: string }>) {
    const token = request.headers.authorization;
    if (!token) return;
    const user = await User.getUserInfo(token);
    if (!user) return;

    const { region } = request.body;
    const filteredUserRegions = [...user.region].filter(
      (userRegion) => userRegion !== region
    );

    const deletedUserRegion = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        region: filteredUserRegions,
        actived_region:
          region === user.actived_region ? null : user.actived_region,
      },
    });

    if (deletedUserRegion) {
      request.set.status = 200;
    }
  }

  static async updateUserActivedRegion(
    request: CustomRequest<{ region: string }>
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

    if (!request.body || !request.body.region) {
      return CustomError({
        message: "데이터가 존재하지 않습니다.",
        status: 401,
      });
    }

    const { region } = request.body;

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        actived_region: region,
      },
    });

    if (updatedUser && request.set) {
      request.set.status = 201;
    }
  }
}

export default Region;

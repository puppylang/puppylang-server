import jwt from "jsonwebtoken";
import { LoggedFrom, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import type {
  DatabaseErrorType,
  NaverLoginReqType,
  ReadUserWalkReqType,
  SocialLoginReqType,
  UserUpdateReqType,
} from "../types/userType";
import {
  deleteAppleUser,
  getAppleUserInfo,
  getKakaoToken,
  getKakaoUserInfo,
  getNaverUserInfo,
  removeSocialAccessToken,
} from "../services/userService";
import type { CustomRequest, PageQuery, Params } from "../types/request";
import { createToken } from "../utils/jwt";
import { getLocalInfo, getLocalInfoWithGeo } from "../services/kakaoRegion";
import type { UserRegionReqType } from "../types/region";
import type { PostQuery } from "../types/postType";
import Post from "./post";
import { CustomError } from "../utils/CustomError";

const prisma = new PrismaClient({});

class User {
  static async getAppleUser(
    request: CustomRequest<SocialLoginReqType & { token: string }>
  ) {
    if (!request.body || !request.body.code || !request.body.token) {
      return CustomError({ status: 401, message: "body가 존재하지 않습니다." });
    }

    const { code, token } = request.body;
    const refreshToken = await getAppleUserInfo(code);

    const { sub: id } = jwt.decode(token) as { sub: string };
    const user = await User.readUserInfo(id, id.slice(0, 10), LoggedFrom.APPLE);
    if (!user) return;

    const jwtAccessToken = createToken(user.id);
    const jwtRefreshToken = createToken(user.id, "refresh");

    await User.saveRefreshToken(
      jwtRefreshToken,
      user.id,
      refreshToken as string
    );

    const response = new Response(
      JSON.stringify({
        token: jwtAccessToken,
        is_first_login: user.is_first_login,
      })
    );

    return response;
  }

  static async getKakaoUser(request: CustomRequest<SocialLoginReqType>) {
    try {
      const { code } = request.body;
      const kakaoUserData = await getKakaoToken(code);
      const kakaoAccessToken = kakaoUserData.access_token;
      if (!kakaoAccessToken) return;

      const { properties, id } = await getKakaoUserInfo(kakaoAccessToken);
      const { nickname } = properties;

      const user = await User.readUserInfo(
        String(id),
        nickname,
        LoggedFrom.KAKAO
      );

      if (!user) return;

      const jwtAccessToken = createToken(user.id);
      const jwtRefreshToken = createToken(user.id, "refresh");

      await User.saveRefreshToken(jwtRefreshToken, user.id, kakaoAccessToken);

      const response = new Response(
        JSON.stringify({
          token: jwtAccessToken,
          is_first_login: user.is_first_login,
        })
      );

      return response;
    } catch (err) {
      console.log("error!!!", err);
    }
  }

  static async saveRefreshToken(
    refreshToken: string,
    userId: string,
    socialAccessToken: string
  ) {
    try {
      await prisma.token.upsert({
        where: {
          user_id: userId,
        },
        update: {
          refresh_token: refreshToken,
        },
        create: {
          user_id: userId,
          refresh_token: refreshToken,
          social_access_token: socialAccessToken,
        },
      });
    } catch (err) {
      console.log(err);
    }
  }

  static async readUserInfo(id: string, name: string, loggedFrom: LoggedFrom) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        const newUser = await prisma.user.create({
          data: {
            id,
            name,
            logged_from: loggedFrom,
          },
        });

        return {
          nickname: newUser.name,
          image: null,
          id: newUser.id,
          is_first_login: true,
        };
      }

      return {
        nickname: user.name,
        image: user.image,
        id: user.id,
        is_first_login: false,
      };
    } catch (err) {
      console.log(err);
    }
  }

  static async getNaverUser(request: CustomRequest<NaverLoginReqType>) {
    try {
      const naverAccessToken = request.body.access_token;
      const naverUserData = await getNaverUserInfo(naverAccessToken);
      const { id, nickname } = naverUserData.response;

      const user = await User.readUserInfo(id, nickname, LoggedFrom.NAVER);
      if (!user) return;

      const jwtAccessToken = createToken(user.id);
      const jwtRefreshToken = createToken(user.id, "refresh");

      await User.saveRefreshToken(jwtRefreshToken, user.id, naverAccessToken);

      const response = new Response(
        JSON.stringify({
          token: jwtAccessToken,
          is_first_login: user.is_first_login,
        })
      );

      return response;
    } catch (err) {
      console.log(err);
    }
  }

  static async deleteUser(
    request: CustomRequest<{ user_id: string; logged_from: LoggedFrom }>
  ) {
    try {
      if (!request.body.user_id || !request.body.logged_from) {
        return CustomError({
          status: 401,
          message: "데이터값이 유효하지 않습니다.",
        });
      }

      const { user_id, logged_from } = request.body;

      const token = await prisma.token.findUnique({
        where: {
          user_id,
        },
      });

      if (logged_from === "APPLE" && token?.social_access_token) {
        const { social_access_token } = token;
        await deleteAppleUser(social_access_token);
      }

      const deletedUser = await prisma.user.delete({
        where: {
          id: user_id,
        },
      });

      if (deletedUser && request.set) {
        request.set.status = 201;
      }
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        const code = err.code;
        if (code !== "P2025") return;
        const error: DatabaseErrorType = new Error("Not existed ID");
        error.status = 401;
        throw error;
      }
    }
  }

  static async updateUser(request: CustomRequest<UserUpdateReqType>) {
    const { id } = request.body;

    try {
      const updatedUser = await prisma.user.update({
        where: {
          id,
        },
        data: request.body,
      });

      if (updatedUser && request.set) {
        request.set.status = 201;
      }
    } catch (err) {
      console.log(err);
      if (err instanceof PrismaClientKnownRequestError) {
        const code = err.code;
        if (code !== "P2025") return;
        const error: DatabaseErrorType = new Error("Not existed ID");
        error.status = 401;
        throw error;
      }
    }
  }

  static async getUser(request: CustomRequest<{ id?: string }>) {
    const token = request.headers.authorization;
    if (!token) return;
    if (request.query && request.query.id) {
      const { id } = request.query;
      const user = await prisma.user.findFirst({
        where: { id },
      });

      return user;
    }

    const user = await User.getUserInfo(token);

    return user;
  }

  static async getUserInfo(token: string) {
    const splicedToken = token.startsWith("Bearer ") ? token.slice(7) : token;
    const verifyToken = jwt.verify(
      splicedToken,
      process.env.JWT_SECRET_KEY as string
    ) as jwt.JwtPayload;
    if (!verifyToken) return;

    const { id } = verifyToken;
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    return user;
  }

  static async getRegion(request: CustomRequest<UserRegionReqType>) {
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

  static async validateUserName(request: CustomRequest<{ name: string }>) {
    const token = request.headers.authorization;

    if (!token) return;
    const name = request.query?.name;
    const currentUser = await User.getUserInfo(token);
    if (!currentUser) return;
    const user = await prisma.user.findUnique({ where: { name } });
    return user ? currentUser.id !== user.id : false;
  }

  static async logoutUser(
    request: CustomRequest<{ user_id: string; logged_from: LoggedFrom }>
  ) {
    if (!request.body.user_id || !request.body.logged_from) {
      return CustomError({
        status: 401,
        message: "데이터값이 유효하지 않습니다.",
      });
    }
    const { user_id, logged_from } = request.body;

    const refreshToken = await prisma.token.findUnique({
      where: {
        user_id: user_id,
      },
    });
    if (!refreshToken) {
      return CustomError({
        status: 401,
        message: "이미 로그아웃한 유저입니다.",
      });
    }

    if (logged_from !== LoggedFrom.APPLE) {
      const { social_access_token } = refreshToken;
      await removeSocialAccessToken(social_access_token, logged_from);
    }

    const deletedToken = await prisma.token.delete({
      where: {
        user_id,
      },
    });

    if (deletedToken && request.set) {
      request.set.status = 201;
    }
  }

  static async getUserPosts(request: CustomRequest<PageQuery & PostQuery>) {
    try {
      if (!request.query) return;

      const token = request.headers.authorization;
      if (!token) {
        return CustomError({
          message: "게시글은 로그인 후 확인 가능합니다.",
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

      const page = Number(request.query.page);
      const size = Number(request.query.size);
      const statusQuery = request.query.status;
      const authorId = request.query.author_id;
      const usePagination = true;

      return Post.fetchPaginatedPosts({
        page,
        size,
        statusQuery,
        usePagination,
        authorId,
      });
    } catch (err) {
      console.log(err);
      return CustomError({ message: "error ", status: 500 });
    }
  }

  static async getUserLikedPosts(
    request: CustomRequest<PageQuery & PostQuery>
  ) {
    try {
      if (!request.query) return;

      const token = request.headers.authorization;
      if (!token) {
        return CustomError({
          message: "게시글은 로그인 후 확인 가능합니다.",
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

      const page = Number(request.query.page);
      const size = Number(request.query.size);
      const usePagination =
        request.query.page !== undefined && request.query.size !== undefined;
      const authorId = user.id;

      const [likedPosts, totalPage] = await prisma.$transaction([
        prisma.like.findMany({
          ...(usePagination && { skip: page * size }),
          ...(usePagination && { take: size }),
          include: { post: true },
          where: { ...(authorId && { author_id: authorId }) },
        }),
        prisma.like.count({ where: { author_id: authorId } }),
      ]);

      const currentPostCount = likedPosts.length;

      return new Response(
        JSON.stringify({
          total_pages: totalPage,
          page: usePagination ? page : null,
          size: usePagination ? size : null,
          first: usePagination ? page === 0 : true,
          last: usePagination
            ? !(totalPage - (page * size + currentPostCount) > 0)
            : true,
          content: likedPosts.map(({ post }) => post),
        })
      );
    } catch (err) {
      console.log(err);
      return CustomError({ message: "error ", status: 500 });
    }
  }

  // 유저가 등록한 반려견으로 산책한 총 횟수
  static async getUserRecordWalksCount(
    request: CustomRequest<ReadUserWalkReqType>
  ) {
    try {
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
      // E: 로그인 정보 //

      if (!request.query?.user_id) {
        const count = await prisma.petWalkRecord.count({
          where: { user_id: user.id },
        });

        return count;
      }

      const { user_id } = request.query;

      const count = await prisma.petWalkRecord.count({
        where: { user_id },
      });

      return count;
    } catch (err) {
      console.log(err);
    }
  }

  // 유저가 등록한 반려견으로 산책한 총 거리
  static async getUserRecordWalksDistance(
    request: CustomRequest<ReadUserWalkReqType>
  ) {
    try {
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
      // E: 로그인 정보 //

      let distanceData = [];
      if (!request.query?.user_id) {
        distanceData = await prisma.petWalkRecord.findMany({
          where: { user_id: user.id },
          select: { distance: true },
        });
      } else {
        const { user_id } = request.query;
        distanceData = await prisma.petWalkRecord.findMany({
          where: { user_id },
          select: { distance: true },
        });
      }

      const filteredDistance = distanceData.filter(({ distance }) => distance);
      const totalDistance = filteredDistance.reduce(
        (acc, { distance }) => acc + distance,
        0
      );

      return { total_distance: totalDistance };
    } catch (err) {
      console.log(err);
    }
  }

  // 내 반려견으로 산책한 경험 목록
  static async getUserRecordWalks(request: CustomRequest<PageQuery & Params>) {
    try {
      const token = request.headers.authorization;
      if (!token) {
        return CustomError({
          message: "산책 경험 목록은 로그인 후 확인 가능합니다.",
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
      // E: 로그인 정보 //

      if (!request.params?.user_id) {
        return CustomError({
          message: "Invalid request: Missing required user_id parameters.",
          status: 400,
        });
      }
      const defaultSizeValue = 20;
      const defaultSortValue = "desc";

      const size = defaultSizeValue || request.query?.size;
      const sort = defaultSortValue || request.query?.sort;

      const userRecordWalks = await prisma.petWalkRecord.findMany({
        take: size,
        orderBy: [{ created_at: sort }],
        include: { locations: true, pet: true },
      });

      const formatUserRecordWalks = userRecordWalks.map((walk) => {
        const { locations } = walk;
        const formattedLocations = locations.map((location) => ({
          ...location,
          latitude: location.latitude.toNumber(),
          longitude: location.longitude.toNumber(),
        }));

        return { ...walk, locations: formattedLocations };
      });

      return new Response(JSON.stringify(formatUserRecordWalks));
    } catch (err) {
      console.log(err);
    }
  }
}

export default User;

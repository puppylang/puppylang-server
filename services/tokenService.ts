import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

import type { CustomContextType } from "../types/request";
import type { DecodedTokenType, SaveRefreshTokenType } from "../types/token";

const prisma = new PrismaClient({});

export const createToken = (id: string, type?: "access" | "refresh") => {
  const newToken = jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET_KEY as string,
    {
      algorithm: "HS256",
      expiresIn: type === "refresh" ? "7d" : 5,
    }
  );

  return newToken;
};

export async function verifyToken({ headers, set }: CustomContextType) {
  const token = headers.authorization;

  if (!token) {
    set.status = 401;
    return;
  }

  const slicedToken = token.startsWith("Bearer ") ? token.slice(7) : "";
  await jwt.verify(
    slicedToken,
    process.env.JWT_SECRET_KEY as string,
    async (error) => {
      if (!error) return;
      const tokenInfo = jwt.decode(slicedToken) as DecodedTokenType;

      if (error && error.name === "TokenExpiredError" && tokenInfo) {
        const userId = tokenInfo.id;
        const userToken = await prisma.token.findUnique({
          where: {
            user_id: userId,
          },
        });

        if (!userToken) {
          set.status = 401;
          return;
        }

        const { refresh_token: refreshToken } = userToken;

        await jwt.verify(
          refreshToken,
          process.env.JWT_SECRET_KEY as string,
          (refreshTokenError) => {
            if (refreshTokenError) {
              set.status = 401;
              return;
            }
          }
        );

        if (!userToken) {
          set.status = 401;
          return;
        }

        const newAccessToken = createToken(userId);
        set.headers["Set-Cookie"] =
          process.env.NODE_ENV === "development"
            ? `token=${newAccessToken};path=/;`
            : `token=${newAccessToken};path=/; SameSite=None; Secure;`;
        await saveRefreshToken({ ...userToken, access_token: newAccessToken });
      }
    }
  );
}

export async function saveRefreshToken({
  refresh_token,
  user_id,
  social_access_token,
  access_token,
}: SaveRefreshTokenType) {
  try {
    await prisma.token.upsert({
      where: {
        user_id,
      },
      update: {
        refresh_token,
        access_token,
      },
      create: {
        user_id,
        refresh_token,
        social_access_token,
        access_token,
      },
    });
  } catch (err) {
    console.log(err);
  }
}

import jwt from "jsonwebtoken";
import type { CustomContextType } from "../types/request";
import { PrismaClient } from "@prisma/client";
import { createToken } from "../utils/jwt";

interface DecodedType {
  id: string;
  iat: number;
  exp: number;
}
const prisma = new PrismaClient({});

export async function verifyToken({ headers, set }: CustomContextType) {
  const token = headers.authorization;
  if (!token) {
    set.status = 401;
    return;
  }

  const slicedToken = token.startsWith("Bearer ") ? token.slice(7) : "";
  jwt.verify(
    slicedToken,
    process.env.JWT_SECRET_KEY as string,
    async (
      error,
      decoded: string | jwt.JwtPayload | undefined | DecodedType
    ) => {
      const id = (decoded as DecodedType).id;
      if (!error) {
        return;
      }

      const hasRefreshToken = await prisma.token.findUnique({
        where: {
          user_id: id,
        },
      });

      if (!hasRefreshToken) {
        set.status = 403;
        return;
      }

      const newAccessToken = createToken(id);
      return newAccessToken;
    }
  );
}

import jwt from "jsonwebtoken";

export const createToken = (id: string, type?: "access" | "refresh") => {
  // TODO accessToken 배포 할 때 만료 시간 30분으로 변경
  const newToken = jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET_KEY as string,
    {
      algorithm: "HS256",
      expiresIn: type === "refresh" ? "7d" : "1d",
    }
  );

  return newToken;
};

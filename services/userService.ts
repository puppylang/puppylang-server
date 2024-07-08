import jwt from "jsonwebtoken";
import { LoggedFrom } from "@prisma/client";
import { HttpProxyAgent } from "hpagent";

import type {
  AppleUserInfo,
  KakaoTokenType,
  KakaoUserInfoType,
  NaverUserInfoType,
} from "../types/userType";

export const getKakaoToken = async (
  code: string
): Promise<KakaoTokenType | undefined> => {
  try {
    const KAKAO_TOKEN_URL = `https://kauth.kakao.com/oauth/token`;
    const formData = new URLSearchParams();
    formData.append("grant_type", "authorization_code");
    formData.append("client_id", process.env.KAKAO_REST_API_KEY as string);
    formData.append("redirect_uri", process.env.KAKAO_REDIRECT_URI as string);
    formData.append("code", code);

    const response = await fetch(KAKAO_TOKEN_URL, {
      method: "POST",
      headers: {
        ContentType: "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: formData,
    });

    const data = (await response.json()) as KakaoTokenType;
    return data;
  } catch (err) {
    console.error(err);
  }
};

export const getKakaoUserInfo = async (
  token: string
): Promise<KakaoUserInfoType | undefined> => {
  try {
    const URL = "https://kapi.kakao.com/v2/user/me";
    const response = await fetch(URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      proxy: process.env.NOBLE_PROXY_URL,
    });

    const data = (await response.json()) as KakaoUserInfoType;
    return data;
  } catch (err) {
    console.log(err);
  }
};

export const getNaverUserInfo = async (
  accessToken: string
): Promise<NaverUserInfoType> => {
  const NAVER_PROFILE_URL = "https://openapi.naver.com/v1/nid/me";
  const response = await fetch(NAVER_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = (await response.json()) as NaverUserInfoType;
  return data;
};

export const removeSocialAccessToken = async (
  token: string,
  loggedFrom: LoggedFrom
) => {
  const NAVER_URL = `https://nid.naver.com/oauth2.0/token?grant_type=delete&client_id=${process.env.NAVER_CLIENT_ID}&client_secret=${process.env.NAVER_CLIENT_SECRET}&access_token=${token}&service_provider=NAVER`;
  const KAKAO_URl = "https://kapi.kakao.com/v1/user/logout";

  if (loggedFrom === "NAVER") {
    const response = await fetch(NAVER_URL);
    const data = await response.json();

    return data;
  }
  if (loggedFrom === "KAKAO") {
    const response = await fetch(KAKAO_URl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const data = await response.json();

    return data;
  }
};

export const createSignWithAppleSecret = () => {
  const key = `-----BEGIN PRIVATE KEY-----\n${process.env.APPLE_SECRET_KEY}\n-----END PRIVATE KEY-----\n`;
  const issuedAt = new Date().getTime() / 1000;
  const expireTime = issuedAt + 60 * 60 * 24 * 30 * 6;

  const token = jwt.sign(
    {
      iss: process.env.APPLE_TEAM_ID,
      iat: issuedAt,
      exp: expireTime,
      aud: "https://appleid.apple.com",
      sub: process.env.APPLE_CLIENT_ID,
    },
    key,
    {
      algorithm: "ES256",
      keyid: process.env.APPLE_KEY_ID,
    }
  );

  return token;
};

export const getAppleUserInfo = async (code: string) => {
  const bodyData = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_secret: createSignWithAppleSecret(),
    client_id: process.env.APPLE_CLIENT_ID as string,
    redirect_uri: process.env.APPLE_REDIRECT_URI as string,
  }).toString();

  const response = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    body: bodyData,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const { refresh_token } = (await response.json()) as AppleUserInfo;

  return refresh_token;
};

export const deleteAppleUser = async (token: string) => {
  const URL = "https://appleid.apple.com/auth/revoke";
  const bodyData = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID as string,
    client_secret: createSignWithAppleSecret(),
    token,
    token_type: "refresh_token",
  }).toString();

  await fetch(URL, {
    method: "POST",
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
    },
    body: bodyData,
  });
};

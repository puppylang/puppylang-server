import { LoggedFrom } from "@prisma/client";

import type {
  KakaoTokenType,
  KakaoUserInfoType,
  NaverUserInfoType,
} from "../types/userType";

export const getKakaoToken = async (code: string): Promise<KakaoTokenType> => {
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
};

export const getKakaoUserInfo = async (
  token: string
): Promise<KakaoUserInfoType> => {
  const URL = "https://kapi.kakao.com/v2/user/me";
  const response = await fetch(URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as KakaoUserInfoType;
  return data;
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

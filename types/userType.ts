import type { Gender } from "@prisma/client";

export interface KakaoTokenType {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  refresh_token_expires_in: number;
}

export interface KakaoUserInfoType {
  id: number;
  connected_at: string;
  properties: {
    nickname: string;
  };
  kakao_account: {
    profile_nickname_needs_agreement: boolean;
    profile: {
      nickname: string;
    };
  };
}

export interface NaverUserInfoType {
  resultcode: string;
  message: string;
  response: {
    id: string;
    nickname: string;
  };
}

export interface SocialLoginReqType {
  code: string;
}

export interface NaverLoginReqType {
  access_token: string;
}

export interface DatabaseErrorType extends Error {
  status?: number;
}

export interface UserUpdateReqType {
  name: string;
  image: string | null;
  id: string;
  gender: Gender | null;
  character: string | null;
  birthday: string;
}

export interface ReadUserWalkReqType {
  user_id: string;
}

export interface AppleUserInfo {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  id_token: string;
}

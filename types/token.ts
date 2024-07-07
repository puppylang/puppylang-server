export interface DecodedTokenType {
  id: string;
  iat: number;
  exp: number;
}

export interface SaveRefreshTokenType {
  refresh_token: string;
  user_id: string;
  social_access_token: string;
  access_token: string;
}

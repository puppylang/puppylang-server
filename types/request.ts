import { type Context } from "elysia";
import type { IncomingHttpHeaders } from "http";

export interface CustomRequest<T> {
  body: T;
  headers: IncomingHttpHeaders;
  method?: string;
  cookie?: T;
  set: {
    status?: number;
  };
  query?: T;
  params?: T;
}

export interface PageQuery {
  page?: number;
  size?: number;
  sort?: string;
}

export interface Params {
  id?: number;
  user_id?: string;
  region?: string;
}

export interface CustomErrorType {
  message: string;
  status: number;
}

export interface CustomContextType extends Omit<Context, "params"> {
  params: Record<never, string>;
}

export interface VerifyTokenType {
  iat: number;
  exp: number;
  id: string;
}

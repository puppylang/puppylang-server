import Elysia from "elysia";
import User from "../controllers/user";

const login = new Elysia({ prefix: "/user" })
  .post("/login-kakao", User.getKakaoUser)
  .post("/login-naver", User.getNaverUser)
  .post("/login-apple", User.getAppleUser);

export default login;

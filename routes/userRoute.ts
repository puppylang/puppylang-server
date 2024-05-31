import Elysia from "elysia";
import User from "../controllers/user";
import { verifyToken } from "../controllers/token";
import Region from "../controllers/region";

const user = new Elysia({ prefix: "/user" })
  .post("/login-kakao", User.getKakaoUser)
  .post("/login-naver", User.getNaverUser)
  .guard(
    {
      beforeHandle(context) {
        verifyToken(context);
      },
    },
    (app) => app.get("", User.getUser)
  )
  .patch("", User.updateUser)
  .get("/name", User.validateUserName)
  .get("/logout", User.logoutUser)
  .delete("", User.deleteUser)

  .get("/posts", User.getUserPosts)
  .get("/liked-posts", User.getUserLikedPosts)

  .get("/record-walks/count", User.getUserRecordWalksCount)
  .get("/record-walks/distance", User.getUserRecordWalksDistance)
  .get("/:user_id/record-walks", User.getUserRecordWalks)

  .post("/region", Region.createRegion)
  .delete("/region", Region.deleteRegion)
  .get("/region", Region.getRegions);

export default user;

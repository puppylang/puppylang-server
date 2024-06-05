import Elysia from "elysia";
import User from "../controllers/user";
import { verifyToken } from "../controllers/token";
import Region from "../controllers/region";

const user = new Elysia({ prefix: "/user" })
  .post("/login-kakao", User.getKakaoUser)
  .post("/login-naver", User.getNaverUser)
  .post("/login-apple", User.getAppleUser)
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
  .post("/logout", User.logoutUser)
  .delete("", User.deleteUser)

  .get("/posts", User.getUserPosts)
  .get("/liked-posts", User.getUserLikedPosts)

  .get("/record-walks/count", User.getUserRecordWalksCount)
  .get("/record-walks/distance", User.getUserRecordWalksDistance)
  .get("/:user_id/record-walks", User.getUserRecordWalks)

  .post("/region", Region.createRegion)
  .delete("/region", Region.deleteRegion)
  .patch("/actived-region", Region.updateUserActivedRegion);

export default user;

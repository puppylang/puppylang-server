import Elysia from "elysia";
import User from "../controllers/user";

const user = new Elysia({ prefix: "/user" })
  .get("", User.getUser)
  .patch("", User.updateUser)
  .get("/name", User.validateUserName)
  .post("/logout", User.logoutUser)
  .delete("", User.deleteUser)

  .get("/posts", User.getUserPosts)
  .get("/liked-posts", User.getUserLikedPosts)
  .get("/submitted-posts", User.getUserSubmittedPosts)

  .get("/record-walks/count", User.getUserRecordWalksCount)
  .get("/record-walks/distance", User.getUserRecordWalksDistance)
  .get("/:user_id/record-walks", User.getUserRecordWalks);

export default user;

import Elysia from "elysia";
import Post from "../controllers/post";
import Like from "../controllers/like";

const post = new Elysia({ prefix: "/posts" })
  .get("/", Post.getPosts)
  .get("/:id", Post.getDetailPost)
  .post("/", Post.createPost)
  .put("/:id", Post.updatePost)
  .delete("/:id", Post.deletePost)
  .post("/:id/likes", Like.createLike)
  .delete("/:id/likes", Like.deleteLike)
  .put("/:id/status", Post.updatePostStatus);

export default post;

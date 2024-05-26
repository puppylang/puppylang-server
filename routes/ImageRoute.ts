import Elysia from "elysia";
import Image from "../controllers/image";

const imageRoute = new Elysia({ prefix: "/image" }).post(
  "",
  Image.uploadImageToAWS
);

export default imageRoute;

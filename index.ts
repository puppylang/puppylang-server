import Elysia from "elysia";
import cors from "@elysiajs/cors";

import { verifyToken } from "./services/tokenService";
import user from "./routes/userRoute";
import post from "./routes/postRoute";
import pet from "./routes/petRoute";
import walk from "./routes/walkRoute";
import chat from "./routes/chatRoom";
import image from "./routes/ImageRoute";
import resumse from "./routes/resumeRoute";
import report from "./routes/reportRoute";
import region from "./routes/regionRoute";
import login from "./routes/loginRoute";

new Elysia()
  .use(
    cors({
      methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "WithCredentials",
        "Access-Control-Allow-Origin",
      ],
    })
  )
  .use(login)
  .onBeforeHandle(async (context) => {
    await verifyToken(context);
  })
  .use(user)
  .use(region)
  .use(resumse)
  .use(image)
  .use(chat)
  .use(report)
  .use(pet)
  .use(walk)
  .use(post)
  .listen(8000);

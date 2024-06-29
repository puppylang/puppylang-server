import Elysia from "elysia";
import cors from "@elysiajs/cors";

import user from "./routes/userRoute";
import post from "./routes/postRoute";
import pet from "./routes/petRoute";
import walk from "./routes/walkRoute";

import { verifyToken } from "./controllers/token";
import chat from "./routes/chatRoom";
import Region from "./controllers/region";
import imageRoute from "./routes/ImageRoute";
import resumse from "./routes/resumeRoute";
import report from "./routes/reportRoute";
import regionRoute from "./routes/regionRoute";

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
  .use(regionRoute)
  .use(resumse)
  .use(imageRoute)
  .use(user)
  .use(chat)
  .use(report)
  .guard(
    {
      beforeHandle(context) {
        verifyToken(context);
      },
    },
    (app) => app.use(pet)
  )
  .use(walk)
  .use(post)
  .get("/", async () => {
    return new Response("Good");
  })
  .listen(8000);

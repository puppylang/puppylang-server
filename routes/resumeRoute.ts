import Elysia from "elysia";
import Resume from "../controllers/resume";

const resumse = new Elysia()
  .post("/resume", Resume.createResume)
  .get("/resumes", Resume.getResumes)
  .put("/resume/:id", Resume.updateResume);

export default resumse;

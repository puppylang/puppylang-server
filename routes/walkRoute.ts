import Elysia from "elysia";
import Walk from "../controllers/walk";

const walk = new Elysia()
  .post("/walk-records", Walk.createPetWalk)
  .post("/sitter-walk-records", Walk.createPetSitterWalk)
  .get("/record-walks", Walk.getRecordWalks)
  .get("/record-walks/:id", Walk.getDetailRecordWalk)
  .get("/record-walks/user", Walk.getRecordWalkByUser);
export default walk;

import Elysia from "elysia";
import Region from "../controllers/region";

const regionRoute = new Elysia({ prefix: "/region" }) //
  .get("", Region.getRegionInfo)
  .post("", Region.createRegion)
  .delete("", Region.deleteRegion)
  .patch("", Region.updateUserActivedRegion)
  .get("/user", Region.getRegion)
  .get("/active", Region.getActivedRegion);

export default regionRoute;

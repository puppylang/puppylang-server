import Elysia from "elysia";
import Report from "../controllers/report";

const report = new Elysia()
  .post("/report", Report.createReport)
  .delete("/report", Report.deleteReport)
  .post("/block", Report.createBlock)
  .delete("/block", Report.deleteBlock);

export default report;

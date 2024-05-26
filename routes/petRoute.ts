import Elysia from "elysia";
import Pet from "../controllers/pet";

const pet = new Elysia({ prefix: "/user/pet" })
  .post("", Pet.createPet)
  .get("", Pet.getPets)
  .patch("", Pet.updatePet)
  .delete("", Pet.deletePet);

export default pet;

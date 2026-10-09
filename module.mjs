// @ts-check
import { module } from "@prisma/composer";
import myV0ProjectService from "./service.mjs";

export default module("my-v0-project", ({ provision }) => {
  provision(myV0ProjectService, { id: "myv0project" });
});

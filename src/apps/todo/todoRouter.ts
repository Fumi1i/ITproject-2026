import { Router } from "express";
import * as controller from "./todoController";

const todoRouter = Router();

todoRouter.get("/", controller.list);
todoRouter.post("/", controller.create);
todoRouter.patch("/:id", controller.updateCompleted);
todoRouter.delete("/:id", controller.remove);

export default todoRouter;

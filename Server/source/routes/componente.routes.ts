import { Router } from "express";
import { componenteController } from "../controllers/componenteController";

export class ComponenteRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new componenteController();

    router.get("/", controller.get);
    router.get("/tamanos", controller.getSizeComponents);
    router.get("/colores", controller.getColorComponents);
    router.get("/materiales", controller.getMaterialComponents);
    router.get("/:id", controller.getById);

    router.post("/", controller.upload.single("imagen"), controller.create);
    router.put("/:id", controller.upload.single("imagen"), controller.update);
    router.delete("/:id", controller.delete);

    return router;
  }
}

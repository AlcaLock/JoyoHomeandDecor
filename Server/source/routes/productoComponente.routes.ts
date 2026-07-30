import { Router } from "express";
import { productoComponenteController } from "../controllers/productoComponenteController";

export class ProductoComponenteRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new productoComponenteController();

    router.get("/", controller.get);
    router.get("/check-existing", controller.checkExistingRelations);
    router.get("/:id_producto/tamanos", controller.getSizesByProductId);
    router.get("/:id_producto/colores", controller.getColorsByProductId);
    router.get("/:id_producto/materiales", controller.getMaterialsByProductId);
    router.post("/", controller.create);

    router.get("/:id_producto", controller.getByProductId);

    router.put("/:id_producto", controller.updateByProduct);

    return router;
  }
}

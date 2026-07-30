import { Router } from "express";
import { productoController } from "../controllers/productoController";

export class ProductoRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new productoController();

    router.get("/", controller.get);
    router.get("/productoStockCompo", controller.getConComponentesYStock); 
    router.post("/", controller.create);

    router.get("/:id", controller.getById); 
    router.put("/:id", controller.update);
    router.delete("/:id", controller.delete);

    return router;
  }
}

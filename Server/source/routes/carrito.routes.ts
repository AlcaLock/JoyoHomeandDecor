import { RequestHandler, Router } from "express";
import { carritoController } from "../controllers/carritoController";

export class CarritoRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new carritoController();

    // Operaciones CRUD básicas

    router.post("/completar-pedido/:carritoId", controller.completeOrder);
    router.post("/", controller.create);
    router.put("/guardar/:usuarioId", controller.guardarCarrito);
    router.put("/abandonar/:usuarioId", controller.abandonarCarrito); 
    router.get("/usuario/:usuarioId", controller.getByUser as RequestHandler);
    router.delete("/usuario/:usuarioId", controller.delete);

    return router;
  }
}

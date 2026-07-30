import { Router } from "express";
import { pedidoController } from "../controllers/pedidoController";
import { authenticateJWT } from "../middleware/authMiddleware";

export class PedidoRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new pedidoController();

    router.get("/", authenticateJWT, controller.get);

    router.post("/", controller.create);
    router.get("/:id", controller.getById);

    router.delete("/:id", controller.delete);

    router.patch("/:id/estado", controller.cambiarEstado);

    return router;
  }
}

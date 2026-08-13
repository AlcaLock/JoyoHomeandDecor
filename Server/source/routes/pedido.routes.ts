import { Router } from "express";
import { pedidoController } from "../controllers/pedidoController";
import { authenticateJWT, authorizeRoles } from "../middleware/authMiddleware";
import { Rol } from "../../generated/prisma";

export class PedidoRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new pedidoController();

    router.get("/", authenticateJWT, controller.get);

    router.post("/", authenticateJWT, controller.create);
    router.get("/:id", authenticateJWT, controller.getById);

    router.delete("/:id", authenticateJWT, authorizeRoles(Rol.ADMIN), controller.delete);

    router.patch("/:id/estado", authenticateJWT, authorizeRoles(Rol.ADMIN), controller.cambiarEstado);

    return router;
  }
}

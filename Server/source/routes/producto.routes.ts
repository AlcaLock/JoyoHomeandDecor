import { Router } from "express";
import { productoController } from "../controllers/productoController";
import { authenticateJWT, authorizeRoles } from "../middleware/authMiddleware";
import { Rol } from "../../generated/prisma";

export class ProductoRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new productoController();

    router.get("/", controller.get);
    router.get("/productoStockCompo", controller.getConComponentesYStock); 
    router.post("/", authenticateJWT, authorizeRoles(Rol.ADMIN), controller.create);

    router.get("/:id", controller.getById); 
    router.put("/:id", authenticateJWT, authorizeRoles(Rol.ADMIN), controller.update);
    router.delete("/:id", authenticateJWT, authorizeRoles(Rol.ADMIN), controller.delete);

    return router;
  }
}

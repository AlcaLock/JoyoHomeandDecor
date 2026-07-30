import { Router } from 'express';
import { usuarioController } from '../controllers/usuarioController';
import { authenticateJWT } from "../middleware/authMiddleware";

export class UsuarioRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new usuarioController();
    
    router.get("/profile", authenticateJWT, controller.userAuth);
    router.get('/', controller.get);
    router.get('/:id', controller.getById);
    router.post("/login", controller.login);
    router.post("/forgot-password", controller.forgotPassword);
    router.post("/register", controller.register);
    router.post("/reset-temp-password", controller.resetTempPassword);
    router.post("/reset-password", controller.resetPassword);
    router.post("/:id/admin-reset-password", controller.adminResetPassword);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
  }
}

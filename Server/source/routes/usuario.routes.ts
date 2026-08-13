import { Router } from 'express';
import { usuarioController } from '../controllers/usuarioController';
import { authenticateJWT, authorizeRoles } from "../middleware/authMiddleware";
import { Rol } from '../../generated/prisma';

export class UsuarioRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new usuarioController();
    
    router.get("/profile", authenticateJWT, controller.userAuth);
    router.get('/', authenticateJWT, authorizeRoles(Rol.ADMIN), controller.get);
    router.get('/:id', authenticateJWT, controller.getById);
    router.post("/login", controller.login);
    router.post("/forgot-password", controller.forgotPassword);
    router.post("/register", controller.register);
    router.post("/reset-temp-password", authenticateJWT, controller.resetTempPassword);
    router.post("/reset-password", controller.resetPassword);
    router.post("/:id/admin-reset-password", authenticateJWT, authorizeRoles(Rol.ADMIN), controller.adminResetPassword);
    router.put('/:id', authenticateJWT, controller.update);
    router.delete('/:id', authenticateJWT, authorizeRoles(Rol.ADMIN), controller.delete);

    return router;
  }
}

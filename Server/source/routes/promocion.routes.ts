// promocion.routes.ts
import { Router } from 'express';
import { promocionController } from '../controllers/promocionController';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';
import { Rol } from '../../generated/prisma';

export class PromocionRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new promocionController();

    router.get('/', controller.get);
    router.get('/:id/productos', controller.getProductosByPromocionId);
    router.get('/:id', controller.getById);
    router.post('/', authenticateJWT, authorizeRoles(Rol.ADMIN), controller.create);
    router.put('/:id', authenticateJWT, authorizeRoles(Rol.ADMIN), controller.update);
    router.delete('/:id', authenticateJWT, authorizeRoles(Rol.ADMIN), controller.delete);
    return router;
  }
}

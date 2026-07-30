// promocion.routes.ts
import { Router } from 'express';
import { promocionController } from '../controllers/promocionController';

export class PromocionRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new promocionController();

    router.get('/', controller.get);
    router.get('/:id/productos', controller.getProductosByPromocionId);
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);
    return router;
  }
}

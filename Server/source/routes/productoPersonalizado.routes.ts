import { Router } from 'express';
import { productoPersonalizadoController } from '../controllers/productoPersonalizadoController';

export class ProductoPersonalizadoRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new productoPersonalizadoController();

    router.get('/', controller.get);
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
  }
}

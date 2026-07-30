import { Router } from 'express';
import { pedidoProductoController } from '../controllers/pedidoProductoController';

export class PedidoProductoRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new pedidoProductoController();

    router.get('/', controller.get);
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
  }
}

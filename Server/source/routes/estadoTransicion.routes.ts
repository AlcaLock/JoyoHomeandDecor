import { Router } from 'express';
import { estadoTransicionController } from '../controllers/estadoTransicionController';

export class EstadoTransicionRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new estadoTransicionController();

    router.get('/', controller.get);
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
  }
}
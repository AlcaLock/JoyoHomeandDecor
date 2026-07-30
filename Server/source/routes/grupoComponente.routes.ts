import { Router } from 'express';
import { componenteController } from '../controllers/componenteController';
import { grupoComponenteController } from '../controllers/grupoComponenteController';

export class grupoComponenteRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new grupoComponenteController();

    router.get('/', controller.get);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
  }
}
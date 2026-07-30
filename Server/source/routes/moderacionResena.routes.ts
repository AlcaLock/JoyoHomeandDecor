import { Router } from 'express';
import { moderacionResenaController } from '../controllers/moderacionResenaController';

export class ModeracionResenaRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new moderacionResenaController();

    router.get('/', controller.get);
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
  }
}
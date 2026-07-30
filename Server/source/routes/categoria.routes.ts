import { Router } from 'express';
import { categoriaController } from '../controllers/categoriaController';

export class CategoriaRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new categoriaController();

    router.get('/', controller.get);
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
  }
}
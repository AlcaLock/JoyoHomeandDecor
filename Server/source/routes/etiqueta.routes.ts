import { Router } from 'express';
import { etiquetaController } from '../controllers/etiquetaController';

export class EtiquetaRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new etiquetaController();

    router.get('/', controller.get);
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
  }
}

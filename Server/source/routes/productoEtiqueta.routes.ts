import { Router } from 'express';
import { productoEtiquetaController } from '../controllers/productoEtiquetaController';

export class ProductoEtiquetaRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new productoEtiquetaController();

    router.get('/', controller.get);
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.delete('/:id', controller.delete);

    return router;
  }
}

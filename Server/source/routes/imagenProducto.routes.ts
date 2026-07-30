import { Router } from 'express';
import { imagenProductoController } from '../controllers/imagenProductoController';

export class ImagenProductoRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new imagenProductoController();

    router.get('/', controller.get);
    router.get('/:id', controller.getById);
    router.post('/upload/:productoId', controller.uploadMultiple); 
    router.put('/upload/:productoId', controller.uploadImages);


    return router;
  }
}

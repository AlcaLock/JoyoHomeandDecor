import { RequestHandler, Router } from 'express';
import { reporteResenaController } from '../controllers/reporteResenaController';

export class ReporteResenaRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new reporteResenaController();

    router.get('/', controller.get);
    router.get('/:id', controller.getById);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
  }
}

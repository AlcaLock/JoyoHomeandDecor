import { RequestHandler, Router } from 'express';
import { carritoProductoController } from '../controllers/carritoProductoController';

export class CarritoProductoRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new carritoProductoController();


router.post('/producto', controller.addProduct); 
router.post('/producto-personalizado', controller.addCustomProduct); 
router.put('/item/:id', controller.updateQuantity as RequestHandler); 
router.delete('/item/:id', controller.delete); 


router.delete('/vaciar/usuario/:usuarioId', controller.clearCart);


    return router;
  }
}
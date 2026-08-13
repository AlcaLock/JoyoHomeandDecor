import { Router } from 'express';
import { ProductoRoutes } from './producto.routes';
import { PedidoRoutes } from './pedido.routes';
import { PromocionRoutes } from './promocion.routes';
import { ResenaRoutes } from './resena.routes';
import { CategoriaRoutes } from './categoria.routes';
import { UsuarioRoutes } from './usuario.routes';
import { ComponenteRoutes } from './componente.routes';
import { EtiquetaRoutes } from './etiqueta.routes';
import { EstadoTransicionRoutes } from './estadoTransicion.routes';
import { ReporteResenaRoutes } from './reporteResena.routes';
import { ModeracionResenaRoutes } from './moderacionResena.routes';
import { ProductoEtiquetaRoutes } from './productoEtiqueta.routes';
import { ProductoComponenteRoutes } from './productoComponente.routes';
import { ProductoPersonalizadoRoutes } from './productoPersonalizado.routes';
import { CarritoRoutes } from './carrito.routes';
import { CarritoProductoRoutes } from './carritoProducto.routes';
import { PedidoProductoRoutes } from './pedidoProducto.routes';
import { ImagenProductoRoutes } from './imagenProducto.routes';
import { RolRoutes } from './rol.routes';
import { grupoComponenteRoutes } from './grupoComponente.routes';

export class AppRoutes {
  static get routes(): Router {
    const router = Router();

    router.use('/producto', ProductoRoutes.routes);
    router.use('/promocion', PromocionRoutes.routes);
    router.use('/pedido', PedidoRoutes.routes);
    router.use('/resena', ResenaRoutes.routes);
    router.use('/categoria', CategoriaRoutes.routes);
    router.use('/usuario', UsuarioRoutes.routes);
    router.use('/componente', ComponenteRoutes.routes);
    router.use('/grupo-componente', grupoComponenteRoutes.routes);
    router.use("/rol", RolRoutes.routes)
    router.use('/etiqueta', EtiquetaRoutes.routes);
    router.use('/imagen-producto', ImagenProductoRoutes.routes);
    router.use('/estado-transicion', EstadoTransicionRoutes.routes);
    router.use('/reporte-resena', ReporteResenaRoutes.routes);
    router.use('/moderacion-resena', ModeracionResenaRoutes.routes);
    router.use('/producto-etiqueta', ProductoEtiquetaRoutes.routes);
    router.use('/producto-componente', ProductoComponenteRoutes.routes);
    router.use('/producto-personalizado', ProductoPersonalizadoRoutes.routes);
    router.use('/carrito', CarritoRoutes.routes);
    router.use('/carrito-producto', CarritoProductoRoutes.routes);
    router.use('/pedido-producto', PedidoProductoRoutes.routes);
    

    return router;
  }
}

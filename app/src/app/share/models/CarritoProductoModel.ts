import { CarritoModel } from './CarritoModel';
import { ProductoModel } from './ProductoModel';
import { ProductoPersonalizadoModel } from './ProductoPersonalizadoModel';

export interface CarritoProductoModel {
    id: number;
    carritoId: number;
    productoId?: number | null;
    precioUnitario?: number;
    personalizadoId?: number | null;
    cantidad: number;
    carrito?: CarritoModel;
    producto?: ProductoModel;
    personalizado?: ProductoPersonalizadoModel;
}
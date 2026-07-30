import { PedidoModel } from './PedidoModel';
import { ProductoModel } from './ProductoModel';
import { ProductoPersonalizadoModel } from './ProductoPersonalizadoModel';

export interface PedidoProductoModel {
    id: number;
    pedidoId: number;
    productoId?: number | null;
    personalizadoId?: number | null;
    cantidad: number;
    precioUnitario: number;

    pedido: PedidoModel;
    producto?: ProductoModel | null;
    personalizado?: ProductoPersonalizadoModel | null;
}
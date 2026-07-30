import { ProductoModel } from './ProductoModel';
import { UsuarioModel } from './UsuarioModel';

import { PedidoProductoModel } from './PedidoProductoModel';
import { PersonalizacionComponenteModel } from './PersonalizacionComponenteModel';
import { CarritoProductoModel } from './CarritoProductoModel';


export interface ProductoPersonalizadoModel {
    id?: number;
    productoBaseId: number;
    configuracion: string;
    precioFinal: number; // Decimal representado como number
    usuarioId: number;
    productoBase?: ProductoModel;
    usuario?: UsuarioModel;
    carritoItems?: CarritoProductoModel[];
    pedidoItems?: PedidoProductoModel[];
    componentes?: PersonalizacionComponenteModel[];

      // Campos calculados dinámicamente
  precioTotalPersonalizado?: number;
  precioBase?: number;
}
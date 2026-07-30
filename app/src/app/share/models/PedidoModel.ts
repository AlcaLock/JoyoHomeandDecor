
import { UsuarioModel } from './UsuarioModel';
import { PedidoProductoModel } from './PedidoProductoModel';
import { EstadoTransicionModel } from './EstadoTransicionModel';
import { MetodoPagoModel } from './MetodoPagoModel';
import { EstadoPedidoModel } from './EstadoPedidoModel';

export interface PedidoModel {
    id: number;
    clienteId: number;
    fecha: Date;
    direccionEnvio: string;
    metodoPago: MetodoPagoModel;
    estado: EstadoPedidoModel;
    estado_legible?: string;
    subtotal: number; 
    total: number;    
    cliente?: UsuarioModel;
    productos: PedidoProductoModel[];
    transiciones: EstadoTransicionModel[];
}
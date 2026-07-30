import { EstadoPedidoModel } from './EstadoPedidoModel';
import { PedidoModel } from './PedidoModel';
import { UsuarioModel } from './UsuarioModel';

export interface EstadoTransicionModel {
    id: number;
    pedidoId: number;
    estado: EstadoPedidoModel;
    fecha: Date;
    administradorId: number;

    pedido: PedidoModel;
    administrador: UsuarioModel;
}
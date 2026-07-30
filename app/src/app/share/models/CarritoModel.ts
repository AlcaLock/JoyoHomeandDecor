import { UsuarioModel } from './UsuarioModel';
import { CarritoProductoModel } from './CarritoProductoModel';

export interface CarritoModel {
    id: number;
    usuarioId: number;
    actualizadoEn: Date;
    usuario?: UsuarioModel;
    productos: CarritoProductoModel[];
}
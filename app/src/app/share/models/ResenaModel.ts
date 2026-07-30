import { UsuarioModel } from './UsuarioModel';
import { ProductoModel } from './ProductoModel';
import { ReporteResenaModel } from './ReporteResenaModel';
import { ModeracionResenaModel } from './ModeracionResenaModel';

export interface ResenaModel {
    id: number;
    usuarioId: number;
    productoId: number;
    fecha: Date;
    comentario: string;
    estrellas: number;
    oculto: boolean;
    activo: boolean;
    usuario?: UsuarioModel;
    producto?: ProductoModel;
    reportes?: ReporteResenaModel[];
    moderaciones?: ModeracionResenaModel[];
}
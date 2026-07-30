import { AccionModeracionModel } from './AccionModeracionModel';
import { ResenaModel } from './ResenaModel';
import { UsuarioModel } from './UsuarioModel';


export interface ModeracionResenaModel {
    id: number;
    resenaId: number;
    administradorId: number;
    accion: AccionModeracionModel;
    comentario?: string | null; 
    fecha: Date;
    resena: ResenaModel;
    administrador: UsuarioModel;
}
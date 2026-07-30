import { EstadoReporteResenaModel } from './EstadoReporteResenaModel';
import { ResenaModel } from './ResenaModel';
import { UsuarioModel } from './UsuarioModel';


export interface ReporteResenaModel {
    id: number;
    resenaId: number;
    usuarioReportaId: number;
    motivo: string;
    fechaReporte: Date;
    estado: EstadoReporteResenaModel;

    resena: ResenaModel;
    usuarioReporta: UsuarioModel;
}
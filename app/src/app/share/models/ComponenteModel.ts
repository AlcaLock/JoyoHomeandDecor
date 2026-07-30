import { GrupoComponenteModel } from './GrupoComponenteModel';
import { ProductoComponenteModel } from './ProductoComponenteModel';
import { PersonalizacionComponenteModel } from './PersonalizacionComponenteModel';

export interface ComponenteModel {
    id: number;
    nombre: string;
    descripcion?: string;
    precio: number;  // Decimal se representa como number en Angular
    grupoComponenteId: number;
    imagenUrl: string,
    grupoComponente?: GrupoComponenteModel;
    productos?: ProductoComponenteModel[];
    personalizaciones?: PersonalizacionComponenteModel[];
}
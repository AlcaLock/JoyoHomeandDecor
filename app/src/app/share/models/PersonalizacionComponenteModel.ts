import { ProductoPersonalizadoModel } from './ProductoPersonalizadoModel';
import { ComponenteModel } from './ComponenteModel';

export interface PersonalizacionComponenteModel {
    productoPersonalizadoId?: number;
    componenteId: number;
    productoPersonalizado?: ProductoPersonalizadoModel;
    componente?: ComponenteModel;
}
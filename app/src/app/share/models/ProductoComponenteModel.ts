import { ProductoModel } from './ProductoModel';
import { ComponenteModel } from './ComponenteModel';

export interface ProductoComponenteModel {
    id?: number;
    id_producto: number;
    id_componente: number;
    producto?: ProductoModel | null;
    componente?: ComponenteModel | null;
}


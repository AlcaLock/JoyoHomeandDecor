import { ProductoEtiquetaModel } from './ProductoEtiquetaModel';

export interface EtiquetaModel {
    id: number;
    nombre: string;
    productos: ProductoEtiquetaModel[];
}
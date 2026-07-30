import { ProductoModel } from './ProductoModel';
import { EtiquetaModel } from './EtiquetaModel';

export interface ProductoEtiquetaModel {
    productoId: number;
    etiquetaId: number;
    producto?: ProductoModel;
    etiqueta?: EtiquetaModel;
}
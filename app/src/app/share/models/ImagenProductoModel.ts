import { ProductoModel } from './ProductoModel';

export interface ImagenProductoModel {
    id: number;
    url: string;
    productoId: number;
    producto?: ProductoModel;
}
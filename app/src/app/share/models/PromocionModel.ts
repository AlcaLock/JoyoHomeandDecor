
import { CategoriaModel } from './CategoriaModel';
import { ProductoModel } from './ProductoModel';
import { TipoDescuentoModel } from './TipoDescuentoModel';

export interface PromocionModel {
    id: number;
    nombre: string;
    tipoDescuento: TipoDescuentoModel; // Cambiado de 'tipo' a 'tipoDescuento'
    descuento: number;
    inicio: Date;
    fin: Date;
    categoriaId?: number | null;
    productoId?: number | null;
    categoria?: CategoriaModel | null;
    producto?: ProductoModel | null;
    estado?: string; 
    color?: string; 
}
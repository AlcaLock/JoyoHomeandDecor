import { ProductoModel } from "./ProductoModel";
import { PromocionModel } from "./PromocionModel";

export interface CategoriaModel {
    id: number;
    nombre: string;
    productos: ProductoModel[];
    promociones: PromocionModel[];
}
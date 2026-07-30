import { CategoriaModel } from "./CategoriaModel";
import { ProductoEtiquetaModel } from "./ProductoEtiquetaModel";
import { ImagenProductoModel } from "./ImagenProductoModel";
import { ResenaModel } from "./ResenaModel";
import { ProductoComponenteModel } from "./ProductoComponenteModel";
import { ProductoPersonalizadoModel } from "./ProductoPersonalizadoModel";
import { PromocionModel } from "./PromocionModel";
import { CarritoProductoModel } from "./CarritoProductoModel";
import { PedidoProductoModel } from "./PedidoProductoModel";

export interface ProductoModel {
    id?: number;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    creadoEn: Date;
    activo: boolean;
    id_categoria: number;
    categoria: CategoriaModel;
    etiquetas: ProductoEtiquetaModel[];
    imagenes: ImagenProductoModel[];
    resenas: ResenaModel[];
    componentes: ProductoComponenteModel[];
    personalizados: ProductoPersonalizadoModel[];
    promociones: PromocionModel[];
    carritoProductos: CarritoProductoModel[];
    pedidoProductos: PedidoProductoModel[];
     promedioValoracion?: number;
     precioConPromocion?: number;
}
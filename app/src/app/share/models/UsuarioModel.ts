
import { ResenaModel } from "./ResenaModel";
import { ProductoPersonalizadoModel } from "./ProductoPersonalizadoModel";
import { CarritoModel } from "./CarritoModel";
import { PedidoModel } from "./PedidoModel";
import { EstadoTransicionModel } from "./EstadoTransicionModel";
import { ReporteResenaModel } from "./ReporteResenaModel";
import { ModeracionResenaModel } from "./ModeracionResenaModel";
import { RolModel } from "./RolModel";

export interface UsuarioModel {
    id: number;
    nombre: string;
    correo: string;
    contrasena: string;
    rol: RolModel;
    isTempPassword?: boolean;
    ultimoLogin?: Date;
    creadoEn: Date;
    resenas: ResenaModel[];
    productosPersonalizados: ProductoPersonalizadoModel[];
    carrito?: CarritoModel;
    pedidos: PedidoModel[];
    estadosTransicion: EstadoTransicionModel[];
    reportesResena: ReporteResenaModel[];
    moderaciones: ModeracionResenaModel[];
}
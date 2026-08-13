import { EstadoPedido } from "../../generated/prisma";



export const estadoTransicion = [
  { pedidoId: 1, estado: EstadoPedido.PAGADO, administradorId: 6 },
  { pedidoId: 2, estado: EstadoPedido.EN_PREPARACION, administradorId: 6 },
];
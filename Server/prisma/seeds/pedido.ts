import { EstadoPedido, MetodoPago } from "../../generated/prisma";

export const pedidos = [
  {
    clienteId: 2,
    fecha: new Date(),
    direccionEnvio: 'Calle 123, Ciudad',
    metodoPago: MetodoPago.TARJETA,
    estado: EstadoPedido.PAGADO,
    subtotal: 163500.0,
    total: 184755.0, // +13%
  },
  {
    clienteId: 3,
    fecha: new Date(),
    direccionEnvio: 'Avenida 456, Ciudad',
    metodoPago: MetodoPago.EFECTIVO,
    estado: EstadoPedido.EN_PREPARACION,
    subtotal: 125000.0,
    total: 141250.0, // +13%
  },
  {
    clienteId: 4,
    fecha: new Date(),
    direccionEnvio: 'Residencial Las Flores, San José',
    metodoPago: MetodoPago.EFECTIVO,
    estado: EstadoPedido.PENDIENTE_PAGO,
    subtotal: 200500.0,
    total: 226565.0, // +13%
  },
    {
    clienteId: 2,
    fecha: new Date(),
    direccionEnvio: 'Calle 123, Ciudad',
    metodoPago: MetodoPago.TARJETA,
    estado: EstadoPedido.ENTREGADO,
    subtotal: 163500.0,
    total: 184755.0, // +13%
  },
];

import { TipoDescuento } from "../../generated/prisma";

export const promociones = [
  {
    nombre: 'Junio para Estrenar en Casa',
    tipo: TipoDescuento.MONTO_FIJO,
    descuento: 7500.0, // ₡7.500
    inicio: new Date('2025-06-01'),
    fin: new Date('2025-06-30'),
    productoId: 1, // Silla de oficina
  },
  {
    nombre: 'Reinventa tu Espacio -20%',
    tipo: TipoDescuento.PORCENTAJE,
    descuento: 20.0, // 20%
    inicio: new Date('2025-07-01'),
    fin: new Date('2025-07-31'),
    categoriaId: 2, // Mesas
  },
  {
    nombre: 'Agosto de Confort',
    tipo: TipoDescuento.MONTO_FIJO,
    descuento: 10000.0, // ₡10.000
    inicio: new Date('2025-08-01'),
    fin: new Date('2025-08-31'),
    productoId: 3, // Sofá
  },
];

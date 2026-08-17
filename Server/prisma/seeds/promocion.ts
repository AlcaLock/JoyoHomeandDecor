import { TipoDescuento } from "../../generated/prisma";

export const promociones = [
  {
    nombre: 'Renueva tu Oficina',
    tipo: TipoDescuento.MONTO_FIJO,
    descuento: 7500.0,
    inicio: new Date('2026-08-16'),
    fin: new Date('2034-08-16'),
    productoId: 1,
  },
  {
    nombre: 'Mesas para Compartir -20%',
    tipo: TipoDescuento.PORCENTAJE,
    descuento: 20.0,
    inicio: new Date('2026-08-16'),
    fin: new Date('2034-08-16'),
    categoriaId: 2,
  },
  {
    nombre: 'Confort para tu Sala',
    tipo: TipoDescuento.MONTO_FIJO,
    descuento: 10000.0,
    inicio: new Date('2026-08-16'),
    fin: new Date('2034-08-16'),
    productoId: 3,
  },
];

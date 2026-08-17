import 'dotenv/config';
import { PrismaClient, TipoDescuento } from '../generated/prisma';

const prisma = new PrismaClient();

const demoPromotions = [
  {
    nombre: 'Renueva tu Oficina',
    tipo: TipoDescuento.MONTO_FIJO,
    descuento: 7500,
    inicio: new Date('2026-08-16T00:00:00.000Z'),
    fin: new Date('2034-08-16T23:59:59.999Z'),
    productoId: 1,
  },
  {
    nombre: 'Mesas para Compartir -20%',
    tipo: TipoDescuento.PORCENTAJE,
    descuento: 20,
    inicio: new Date('2026-08-16T00:00:00.000Z'),
    fin: new Date('2034-08-16T23:59:59.999Z'),
    categoriaId: 2,
  },
  {
    nombre: 'Confort para tu Sala',
    tipo: TipoDescuento.MONTO_FIJO,
    descuento: 10000,
    inicio: new Date('2026-08-16T00:00:00.000Z'),
    fin: new Date('2034-08-16T23:59:59.999Z'),
    productoId: 3,
  },
];

const obsoleteSeedPromotionNames = [
  'Junio para Estrenar en Casa',
  'Reinventa tu Espacio -20%',
  'Agosto de Confort',
];

async function seedDemoPromotions() {
  await prisma.promocion.deleteMany({
    where: { nombre: { in: obsoleteSeedPromotionNames } },
  });

  for (const promotion of demoPromotions) {
    const existing = await prisma.promocion.findFirst({
      where: { nombre: promotion.nombre },
    });

    if (existing) {
      await prisma.promocion.update({
        where: { id: existing.id },
        data: promotion,
      });
    } else {
      await prisma.promocion.create({ data: promotion });
    }
  }

  console.log(`Promociones demo sincronizadas: ${demoPromotions.length}`);
}

seedDemoPromotions()
  .catch((error) => {
    console.error('No se pudieron sincronizar las promociones demo:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
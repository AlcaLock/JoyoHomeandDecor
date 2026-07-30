import { categorias } from './seeds/categoria';
import { usuarios } from './seeds/usuario';
import { productos } from './seeds/producto';
import { etiquetas } from './seeds/etiqueta';
import { productoEtiqueta } from './seeds/productoEtiqueta';
import { imagenesProducto } from './seeds/imagenProducto';
import { resenas } from './seeds/resena';
import { componentes } from './seeds/componente';
import { productoComponente } from './seeds/productoComponente';
import { productoPersonalizado } from './seeds/productoPersonalizado';
import { personalizacionComponente } from './seeds/personalizacionComponente';
import { promociones } from './seeds/promocion';
import { carritos } from './seeds/carrito';
import { carritoProducto } from './seeds/carritoProducto';
import { pedidos } from './seeds/pedido';
import { pedidoProducto } from './seeds/pedidoProducto';
import { estadoTransicion } from './seeds/estadoTransicion';
import { reporteResena } from './seeds/reporteResena';
import { moderacionResena } from './seeds/moderacionResena';
import { grupoComponentes } from './seeds/grupoComponente';

import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();

async function seed() {
  try {
   // 1. Modelos independientes primero
    await prisma.categoria.createMany({ data: categorias });
    await prisma.grupoComponente.createMany({ data: grupoComponentes });
    await prisma.etiqueta.createMany({ data: etiquetas });
    await prisma.usuario.createMany({ data: usuarios });

    // 2. Modelos que dependen de los anteriores
    await prisma.componente.createMany({ data: componentes });
    await prisma.producto.createMany({ data: productos });

    // 3. Relaciones muchos-a-muchos
    await prisma.productoEtiqueta.createMany({ data: productoEtiqueta });
    await prisma.productoComponente.createMany({ data: productoComponente });
    await prisma.imagenProducto.createMany({ data: imagenesProducto });

    // 4. Modelos que dependen de múltiples relaciones
    await prisma.resena.createMany({ data: resenas });
    await prisma.productoPersonalizado.createMany({ data: productoPersonalizado });
    await prisma.personalizacionComponente.createMany({ data: personalizacionComponente });
    await prisma.promocion.createMany({ data: promociones });

    // 5. Flujo de compra
    await prisma.carrito.createMany({ data: carritos });
    await prisma.carritoProducto.createMany({ data: carritoProducto });
    await prisma.pedido.createMany({ data: pedidos });
    await prisma.pedidoProducto.createMany({ data: pedidoProducto });
    await prisma.estadoTransicion.createMany({ data: estadoTransicion });

    // 6. Moderación
    await prisma.reporteResena.createMany({ data: reporteResena });
    await prisma.moderacionResena.createMany({ data: moderacionResena });

    console.log("✅ Seed completado exitosamente");
  } catch (error) {
    console.error("❌ Error al ejecutar seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();

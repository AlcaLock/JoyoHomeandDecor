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
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

import { PrismaClient, Rol } from '../generated/prisma';
const prisma = new PrismaClient();

async function seed() {
  try {
   // 1. Modelos independientes primero
    await prisma.categoria.createMany({ data: categorias, skipDuplicates: true });
    await prisma.grupoComponente.createMany({ data: grupoComponentes, skipDuplicates: true });
    await prisma.etiqueta.createMany({ data: etiquetas, skipDuplicates: true });

    const configuredAdminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
    const generatedAdminPassword = randomBytes(12).toString('hex');

    if (!configuredAdminPassword) {
      console.warn('⚠️ SEED_ADMIN_PASSWORD no definido; se generó un password admin aleatorio para este seed.');
    }

    const usuariosConHash = await Promise.all(
      usuarios.map(async (usuario) => {
        const plainPassword =
          usuario.rol === Rol.ADMIN
            ? configuredAdminPassword || generatedAdminPassword
            : usuario.contrasena;

        return {
          ...usuario,
          contrasena: await bcrypt.hash(plainPassword, 10),
        };
      })
    );

    await prisma.usuario.createMany({ data: usuariosConHash, skipDuplicates: true });

    // 2. Modelos que dependen de los anteriores
    await prisma.componente.createMany({ data: componentes, skipDuplicates: true });
    for (const producto of productos) {
      const existente = await prisma.producto.findFirst({
        where: { nombre: producto.nombre },
        select: { id: true },
      });

      if (existente) {
        await prisma.producto.update({
          where: { id: existente.id },
          data: producto,
        });
      } else {
        await prisma.producto.create({ data: producto });
      }
    }

    // 3. Relaciones muchos-a-muchos
    await prisma.productoEtiqueta.createMany({ data: productoEtiqueta, skipDuplicates: true });
    await prisma.productoComponente.createMany({ data: productoComponente, skipDuplicates: true });
    await prisma.imagenProducto.createMany({ data: imagenesProducto, skipDuplicates: true });

    // 4. Modelos que dependen de múltiples relaciones
    await prisma.resena.createMany({ data: resenas, skipDuplicates: true });
    await prisma.productoPersonalizado.createMany({ data: productoPersonalizado, skipDuplicates: true });
    await prisma.personalizacionComponente.createMany({ data: personalizacionComponente, skipDuplicates: true });
    await prisma.promocion.createMany({ data: promociones, skipDuplicates: true });

    // 5. Flujo de compra
    await prisma.carrito.createMany({ data: carritos, skipDuplicates: true });
    await prisma.carritoProducto.createMany({ data: carritoProducto, skipDuplicates: true });
    if ((await prisma.pedido.count()) === 0) {
      await prisma.pedido.createMany({ data: pedidos });
      await prisma.pedidoProducto.createMany({ data: pedidoProducto });
      await prisma.estadoTransicion.createMany({ data: estadoTransicion });
    }

    // 6. Moderación
    await prisma.reporteResena.createMany({ data: reporteResena, skipDuplicates: true });
    await prisma.moderacionResena.createMany({ data: moderacionResena, skipDuplicates: true });

    console.log("✅ Seed completado exitosamente");
  } catch (error) {
    console.error("❌ Error al ejecutar seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();

import { PrismaClient } from './generated/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash('admin123', 10);
  const result = await prisma.usuario.updateMany({
    where: { correo: 'admin.prueba@ejemplo.com' },
    data: { contrasena: hash },
  });
  console.log('Usuarios actualizados:', result.count);
  await prisma.$disconnect();
}

main();

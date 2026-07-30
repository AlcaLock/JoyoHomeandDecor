import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { EstadoCarrito, PrismaClient } from "../../generated/prisma";

export class carritoController {
  prisma = new PrismaClient();

getByUser = async (request: Request, response: Response, next: NextFunction) => {
  try {
    // 1️ Validar ID de usuario
    const usuarioId = parseInt(request.params.usuarioId);
    if (isNaN(usuarioId)) return next(AppError.badRequest('ID de usuario inválido'));

    // 2️ Verificar si el usuario existe
    const usuarioExiste = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuarioExiste) return next(AppError.notFound('Usuario no encontrado'));

    // 3️ Buscar carrito activo más reciente (TEMPORAL, PENDIENTE, ABANDONADO)
    let carrito = await this.prisma.carrito.findFirst({
      where: {
        usuarioId,
        estado: { in: [EstadoCarrito.TEMPORAL, EstadoCarrito.PENDIENTE] }
      },
      orderBy: { actualizadoEn: 'desc' },
      include: {
        productos: {
          include: {
            producto: { include: { imagenes: { select: { url: true, id: true } } } },
            personalizado: {
              include: {
                productoBase: { include: { imagenes: { select: { url: true, id: true } } } },
                componentes: { include: { componente: true } }
              }
            }
          }
        }
      }
    });

    // 4️⃣ Si no hay carrito activo, crear uno TEMPORAL
    if (!carrito) {
      carrito = await this.prisma.carrito.create({
        data: { usuarioId, estado: EstadoCarrito.TEMPORAL },
        include: {
          productos: {
            include: {
              producto: { include: { imagenes: { select: { url: true, id: true } } } },
              personalizado: {
                include: {
                  productoBase: { include: { imagenes: { select: { url: true, id: true } } } },
                  componentes: { include: { componente: true } }
                }
              }
            }
          }
        }
      });
    }

    //  Devolver carrito activo (nuevo o existente)
    return response.json(carrito);

  } catch (err: any) {
    console.error('Error al obtener carrito:', err);

    // Fallback general
    next(AppError.internalServer('Error al obtener el carrito'));
  }
};




completeOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const carritoId = parseInt(req.params.carritoId);
    if (isNaN(carritoId)) return next(AppError.badRequest('ID de carrito inválido'));

    // Buscar carrito específico
    const carritoActivo = await this.prisma.carrito.findUnique({
      where: { id: carritoId },
      include: { productos: true }
    });

    if (!carritoActivo) {
      return next(AppError.notFound('No se encontró el carrito para completar'));
    }

    // Si ya está COMPLETADO, devolver error
    if (carritoActivo.estado === 'COMPLETADO') {
      return next(AppError.badRequest('El carrito ya fue completado'));
    }

    // Transacción para actualizar y crear nuevo carrito
    const [carritoCompletado, nuevoCarrito] = await this.prisma.$transaction([
      this.prisma.carrito.update({
        where: { id: carritoActivo.id },
        data: { estado: 'COMPLETADO' },
        include: { productos: true }
      }),
      this.prisma.carrito.create({
        data: { usuarioId: carritoActivo.usuarioId, estado: 'TEMPORAL' },
        include: { productos: true }
      })
    ]);

    res.status(200).json({
      success: true,
      message: 'Carrito completado correctamente',
      carritoCompletado,
      nuevoCarrito
    });

  } catch (error: unknown) {
    console.error('Error en completeOrder:', error);
    next(AppError.internalServer('Error al completar el carrito'));
  }
};


  // Guardar carrito explícitamente
  guardarCarrito = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const usuarioId = parseInt(request.params.usuarioId);
      if (isNaN(usuarioId)) return next(AppError.badRequest('ID de usuario inválido'));

      // Convertir carrito ABANDONADO o TEMPORAL a PENDIENTE
      await this.prisma.carrito.updateMany({
        where: { usuarioId, estado: { in: ['ABANDONADO', 'TEMPORAL'] } },
        data: { estado: 'PENDIENTE', actualizadoEn: new Date() }
      });

      response.json({ success: true });
    } catch (error) {
      console.error('Error al guardar carrito:', error);
      next(AppError.internalServer('Error al guardar carrito'));
    }
  };

  // Crear carrito manualmente (usualmente se crea automáticamente)
  create = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { usuarioId } = request.body;
      if (!usuarioId) return next(AppError.badRequest('El ID de usuario es requerido'));

      const usuarioExiste = await this.prisma.usuario.findUnique({ where: { id: Number(usuarioId) } });
      if (!usuarioExiste) return next(AppError.notFound('Usuario no encontrado'));

      const nuevoCarrito = await this.prisma.carrito.create({
        data: { usuarioId, estado: 'TEMPORAL' },
        include: { productos: true }
      });

      response.status(201).json(nuevoCarrito);
    } catch (error) {
      console.error('Error al crear carrito:', error);
      next(AppError.internalServer('Error al crear el carrito'));
    }
  };

  // Eliminar carrito
  delete = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const usuarioId = parseInt(request.params.usuarioId);
      if (isNaN(usuarioId)) return next(AppError.badRequest('ID de usuario inválido'));

      // Buscar carrito más reciente TEMPORAL, PENDIENTE o ABANDONADO
      const carritoExistente = await this.prisma.carrito.findFirst({
        where: { usuarioId, estado: { in: ['TEMPORAL', 'PENDIENTE', 'ABANDONADO'] } },
        orderBy: { actualizadoEn: 'desc' }
      });

      if (!carritoExistente) return next(AppError.notFound('Carrito no encontrado'));

      // Eliminar productos primero
      await this.prisma.carritoProducto.deleteMany({ where: { carritoId: carritoExistente.id } });

      // Eliminar carrito
      await this.prisma.carrito.delete({ where: { id: carritoExistente.id } });

      response.status(204).send();
    } catch (error) {
      console.error('Error al eliminar carrito:', error);
      next(AppError.internalServer('Error al eliminar el carrito'));
    }
  };

// Cambiar estado de carrito a ABANDONADO
abandonarCarrito = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const usuarioId = parseInt(request.params.usuarioId);
    if (isNaN(usuarioId)) return next(AppError.badRequest('ID de usuario inválido'));

    // Buscar carrito más reciente que esté TEMPORAL o PENDIENTE
    const carritoExistente = await this.prisma.carrito.findFirst({
      where: { usuarioId, estado: { in: ['TEMPORAL'] } },
      orderBy: { actualizadoEn: 'desc' }
    });

    if (!carritoExistente) {
      return next(AppError.notFound('No se encontró un carrito para abandonar'));
    }

    // Cambiar estado a ABANDONADO
    const carritoAbandonado = await this.prisma.carrito.update({
      where: { id: carritoExistente.id },
      data: { estado: 'ABANDONADO', actualizadoEn: new Date() },
      include: { productos: true }
    });

    response.json({
      success: true,
      message: 'Carrito marcado como ABANDONADO',
      carrito: carritoAbandonado
    });
  } catch (error) {
    console.error('Error al abandonar carrito:', error);
    next(AppError.internalServer('Error al abandonar carrito'));
  }
};


}

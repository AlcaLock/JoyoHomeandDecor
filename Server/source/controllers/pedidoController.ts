import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { PrismaClient, Rol } from "../../generated/prisma";

export class pedidoController {
  prisma = new PrismaClient();

get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as { id: number; rol: Rol };

    const whereClause = user.rol === Rol.ADMIN ? {} : { clienteId: user.id };

    const pedidos = await this.prisma.pedido.findMany({
      where: whereClause,
      include: {
        cliente: true,
        transiciones: true,
        productos: true,
      },
    });

    res.json(pedidos);
  } catch (error) {
    next(error);
  }
};


getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(AppError.badRequest('ID inválido'));

    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: true,
        transiciones: true,
        productos: {
          include: {
            producto: true,
            personalizado: {
              include: {
                productoBase: true,
                componentes: {
                  include: {
                    componente: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!pedido) return next(AppError.notFound('No existe el pedido'));

    res.json(pedido);
  } catch (error) {
    next(error);
  }
};

create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      usuarioId, 
      direccionEnvio, 
      metodoPago, 
      estado = 'PENDIENTE_PAGO',
      subtotal,
      total,
      items 
    } = req.body;

    if (!usuarioId || !direccionEnvio || !metodoPago || 
        subtotal === undefined || total === undefined || !items?.length) {
      return next(AppError.badRequest('Faltan datos obligatorios'));
    }

    // Verificar existencia de usuario
    const usuarioExists = await this.prisma.usuario.findUnique({
      where: { id: Number(usuarioId) }
    });
    if (!usuarioExists) {
      return next(AppError.notFound('Usuario no encontrado'));
    }


    const pedido = await this.prisma.$transaction(async (prisma) => {
      // 1. Crear el pedido principal
      const nuevoPedido = await prisma.pedido.create({
        data: {
          clienteId: Number(usuarioId),
          direccionEnvio,
          metodoPago,
          estado,
          subtotal: Number(subtotal),
          total: Number(total)
        }
      });

      // 2. Agregar productos al pedido y actualizar stock
      const productosPedido = await Promise.all(
        items.map(async (item: any) => {
          const cantidad = Number(item.cantidad);


          if (item.productoId) {
            const producto = await prisma.producto.findUnique({
              where: { id: Number(item.productoId) },
              select: { stock: true }
            });

            if (!producto) {
              throw AppError.notFound(`Producto ${item.productoId} no encontrado`);
            }
            if (producto.stock < cantidad) {
              throw AppError.badRequest(
                `Stock insuficiente para el producto ${item.productoId}`
              );
            }
          } else if (item.personalizadoId) {
            const productoPersonalizado = await prisma.productoPersonalizado.findUnique({
              where: { id: Number(item.personalizadoId) },
              include: { productoBase: true }
            });

            if (!productoPersonalizado) {
              throw AppError.notFound(
                `Producto personalizado ${item.personalizadoId} no encontrado`
              );
            }
            if (productoPersonalizado.productoBase.stock < cantidad) {
              throw AppError.badRequest(
                `Stock insuficiente para el producto base del personalizado ${item.personalizadoId}`
              );
            }
          }

          // Crear el item del pedido
          const pedidoProducto = await prisma.pedidoProducto.create({
            data: {
              pedidoId: nuevoPedido.id,
              productoId: item.productoId ? Number(item.productoId) : null,
              personalizadoId: item.personalizadoId ? Number(item.personalizadoId) : null,
              cantidad,
              precioUnitario: Number(item.precioUnitario)
            }
          });

          // Descontar stock después de validar
          if (item.productoId) {
            await prisma.producto.update({
              where: { id: Number(item.productoId) },
              data: { stock: { decrement: cantidad } }
            });
          } else if (item.personalizadoId) {
            const productoPersonalizado = await prisma.productoPersonalizado.findUnique({
              where: { id: Number(item.personalizadoId) },
              include: { productoBase: true }
            });

            if (productoPersonalizado) {
              await prisma.producto.update({
                where: { id: productoPersonalizado.productoBaseId },
                data: { stock: { decrement: cantidad } }
              });
            }
          }

          return pedidoProducto;
        })
      );

      // 3. Crear transición de estado inicial
      await prisma.estadoTransicion.create({
        data: {
          pedidoId: nuevoPedido.id,
          estado,
          administradorId: Number(usuarioId), 
          fecha: new Date()
        }
      });

      return { ...nuevoPedido, productos: productosPedido };
    });

    res.status(201).json(pedido);
  } catch (error) {
    console.error('Error al crear pedido:', error);
    next(AppError.internalServer('Error al crear el pedido'));
  }
};


cambiarEstado = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(AppError.badRequest('ID inválido'));

    const { estado, administradorId } = req.body;

    if (!estado) {
      return next(AppError.badRequest('Se requiere estado'));
    }

    // Verificar existencia del pedido
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      select: { id: true }
    });
    if (!pedido) return next(AppError.notFound('Pedido no encontrado'));

    let admin: { id: number } | null = null;
    if (administradorId) {
      admin = await this.prisma.usuario.findUnique({
        where: { id: administradorId },
        select: { id: true }
      });
      if (!admin) return next(AppError.forbidden('Acceso no autorizado'));
    }

    // Actualizar estado
    const pedidoActualizado = await this.prisma.pedido.update({
      where: { id },
      data: { estado },
      include: {
        productos: true,
        transiciones: { orderBy: { fecha: 'desc' }, take: 1 }
      }
    });

    // Registrar nueva transición solo si es admin
    let transicion = null;
    if (admin) {
      transicion = await this.prisma.estadoTransicion.create({
        data: {
          pedidoId: id,
          estado,
          administradorId: admin.id,
          fecha: new Date()
        }
      });
    }

    res.json({
      ...pedidoActualizado,
      ultimaTransicion: transicion
    });
  } catch (error) {
    next(error);
  }
};


  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest('ID inválido'));

      await this.prisma.pedido.delete({ where: { id } });
      res.json({ mensaje: 'Pedido eliminado' });
    } catch (error) {
      next(error);
    }
  };
}

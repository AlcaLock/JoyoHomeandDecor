import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { PrismaClient } from "../../generated/prisma";
import { Decimal } from "../../generated/prisma/runtime/library";

export class carritoProductoController {
  prisma = new PrismaClient();

addProduct = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { usuarioId, productoId } = request.body;
    if (!usuarioId || !productoId) {
      return next(AppError.badRequest("UsuarioID y ProductoID son requeridos"));
    }

    const now = new Date();
    const nowTime = now.getTime(); // Convertir a número (milisegundos)

    // Traer producto con promociones (sin confiar solo en Prisma, validamos también en JS)
    let producto = await this.prisma.producto.findUnique({
      where: { id: Number(productoId) },
      include: {
        promociones: {
          where: {
            inicio: { lte: now },
            fin: { gte: now },
            productoId: { not: null }
          },
          orderBy: { fin: "asc" }
        },
        categoria: {
          include: {
            promociones: {
              where: {
                inicio: { lte: now },
                fin: { gte: now },
                categoriaId: { not: null }
              },
              orderBy: { fin: "asc" }
            }
          }
        },
        imagenes: true
      }
    });

    if (!producto || producto.stock <= 0) {
      return next(AppError.notFound("Producto no encontrado, inactivo o sin stock"));
    }

    // Filtro extra en JS para evitar que se cuele alguna promoción inválida
    const promocionesProducto = producto.promociones.filter(p => {
      const inicioTime = new Date(p.inicio).getTime(); // Convertir a número
      const finTime = new Date(p.fin).getTime(); // Convertir a número
      console.log(`Promoción de producto: ${p.nombre}, inicio: ${inicioTime}, fin: ${finTime}, now: ${nowTime}`);
      return nowTime >= inicioTime && nowTime <= finTime;
    });

    const promocionesCategoria = producto.categoria?.promociones.filter(p => {
      const inicioTime = new Date(p.inicio).getTime(); // Convertir a número
      const finTime = new Date(p.fin).getTime(); // Convertir a número
      console.log(`Promoción de categoría: ${p.nombre}, inicio: ${inicioTime}, fin: ${finTime}, now: ${nowTime}`);
      return nowTime >= inicioTime && nowTime <= finTime;
    }) || [];

    // Prioridad: primero promoción de producto, luego de categoría
    let promocionVigente = promocionesProducto.length > 0
      ? promocionesProducto[0]
      : (promocionesCategoria.length > 0 ? promocionesCategoria[0] : null);

    // Verificar nuevamente que la promoción no esté vencida
    if (promocionVigente) {
      const inicioTime = new Date(promocionVigente.inicio).getTime(); // Convertir a número
      const finTime = new Date(promocionVigente.fin).getTime(); // Convertir a número
      console.log(`Promoción vigente: ${promocionVigente.nombre}, inicio: ${inicioTime}, fin: ${finTime}, now: ${nowTime}`);
      if (nowTime < inicioTime || nowTime > finTime) {
        promocionVigente = null; // La promoción está vencida, no se aplica
        console.log("Promoción vencida, no se aplica.");
      }
    }

    // Precio base
    let precioUnitario = new Decimal(producto.precio);

    // Aplicar promoción vigente si existe
    if (promocionVigente) {
      console.log(`Aplicando promoción: ${promocionVigente.nombre}`);
      if (promocionVigente.tipo === "PORCENTAJE") {
        precioUnitario = new Decimal(producto.precio).mul(new Decimal(1).minus(promocionVigente.descuento / 100));
      } else if (promocionVigente.tipo === "MONTO_FIJO") {
        precioUnitario = new Decimal(producto.precio).minus(promocionVigente.descuento);
      }
      if (precioUnitario.lessThan(0)) {
        precioUnitario = new Decimal(0); // seguridad: nunca precios negativos
      }
    } else {
      console.log("No se aplica ninguna promoción.");
    }

    // Crear o actualizar carrito
    const result = await this.prisma.$transaction(async (prisma) => {
      let carrito = await prisma.carrito.findFirst({
        where: { usuarioId: Number(usuarioId), estado: { in: ["TEMPORAL", "PENDIENTE", "ABANDONADO"] } },
        orderBy: { actualizadoEn: "desc" }
      });

      if (!carrito) {
        carrito = await prisma.carrito.create({ data: { usuarioId: Number(usuarioId), estado: "TEMPORAL" } });
      }

      const itemExistente = await prisma.carritoProducto.findFirst({
        where: { carritoId: carrito.id, productoId: Number(productoId) }
      });

      const cantidadFinal = itemExistente ? itemExistente.cantidad + 1 : 1;
      if (cantidadFinal > producto.stock) {
        throw AppError.badRequest("No hay suficiente stock disponible");
      }

      if (itemExistente) {
        return prisma.carritoProducto.update({
          where: { id: itemExistente.id },
          data: { cantidad: cantidadFinal, precioUnitario },
          include: { producto: { include: { imagenes: true } } }
        });
      } else {
        return prisma.carritoProducto.create({
          data: { carritoId: carrito.id, productoId: Number(productoId), cantidad: 1, precioUnitario },
          include: { producto: { include: { imagenes: true } } }
        });
      }
    });

    response.status(201).json({ ...result, mensaje: "Producto agregado al carrito correctamente" });
  } catch (error) {
    console.error("Error al agregar producto al carrito:", error);
    next(AppError.internalServer("Error al agregar producto al carrito"));
  }
};


addCustomProduct = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { usuarioId, personalizadoId, cantidad } = request.body;

    if (!usuarioId || !personalizadoId) {
      return next(AppError.badRequest("UsuarioID y PersonalizadoID son requeridos"));
    }

    const cantidadFinal = cantidad ? parseInt(cantidad) : 1;
    if (isNaN(cantidadFinal) || cantidadFinal <= 0) {
      return next(AppError.badRequest("Cantidad debe ser un número válido mayor a 0"));
    }

    // Traer producto personalizado con base, componentes y promociones
    const productoPersonalizado = await this.prisma.productoPersonalizado.findUnique({
      where: { id: Number(personalizadoId) },
      include: {
        productoBase: {
          include: {
            promociones: true,
            categoria: { include: { promociones: true } }
          }
        },
        componentes: { include: { componente: true } }
      }
    });

    if (!productoPersonalizado) {
      return next(AppError.notFound("Producto personalizado no encontrado"));
    }

    const now = new Date().getTime();

    // Filtrar promociones de producto base
    const promocionesProducto = (productoPersonalizado.productoBase.promociones || []).filter(p => {
      const inicio = new Date(p.inicio).getTime();
      const fin = new Date(p.fin).getTime();
      return now >= inicio && now <= fin;
    });

    // Filtrar promociones de categoría
    const promocionesCategoria = (productoPersonalizado.productoBase.categoria?.promociones || []).filter(p => {
      const inicio = new Date(p.inicio).getTime();
      const fin = new Date(p.fin).getTime();
      return now >= inicio && now <= fin;
    });

    // Prioridad: producto > categoría
    const promocionVigente = promocionesProducto.length > 0
      ? promocionesProducto[0]
      : (promocionesCategoria.length > 0 ? promocionesCategoria[0] : null);

    // Precios base usando Decimal
    const precioBase = new Decimal(productoPersonalizado.productoBase.precio);
    let precioBaseConDescuento = new Decimal(precioBase);
    let descuento = new Decimal(0);

    if (promocionVigente) {
      if (promocionVigente.tipo === "PORCENTAJE") {
        descuento = precioBase.mul(new Decimal(promocionVigente.descuento).div(100));
        precioBaseConDescuento = precioBase.minus(descuento);
      } else if (promocionVigente.tipo === "MONTO_FIJO") {
        descuento = new Decimal(promocionVigente.descuento);
        precioBaseConDescuento = precioBase.minus(descuento);
      }
      if (precioBaseConDescuento.lessThan(0)) {
        precioBaseConDescuento = new Decimal(0);
      }
    }

    // Precio de componentes adicionales
    const precioComponentes = productoPersonalizado.componentes.reduce(
      (sum, comp) => sum.add(new Decimal(comp.componente.precio)),
      new Decimal(0)
    );

    // Precio unitario para carrito (solo producto base con promoción)
    const precioUnitario = precioBaseConDescuento;

    // Precio total del personalizado (base con descuento + componentes)
    const precioTotalPersonalizado = precioBaseConDescuento.add(precioComponentes);

    // Helper para convertir Decimal a number
    const toNumber = (value: any) => (value instanceof Decimal ? value.toNumber() : Number(value));

    // Transacción carrito
    const result = await this.prisma.$transaction(async (prisma) => {
      let carrito = await prisma.carrito.findFirst({
        where: {
          usuarioId: Number(usuarioId),
          estado: { in: ["TEMPORAL", "PENDIENTE", "ABANDONADO"] },
        },
        orderBy: { actualizadoEn: "desc" },
      });

      if (!carrito) {
        carrito = await prisma.carrito.create({
          data: { usuarioId: Number(usuarioId), estado: "TEMPORAL" },
        });
      }

      const itemExistente = await prisma.carritoProducto.findFirst({
        where: { carritoId: carrito.id, personalizadoId: Number(personalizadoId) },
      });

      if (itemExistente) {
        return prisma.carritoProducto.update({
          where: { id: itemExistente.id },
          data: { cantidad: cantidadFinal, precioUnitario },
          include: { personalizado: { include: { productoBase: true, componentes: { include: { componente: true } } } } },
        });
      } else {
        return prisma.carritoProducto.create({
          data: {
            carritoId: carrito.id,
            personalizadoId: Number(personalizadoId),
            cantidad: cantidadFinal,
            precioUnitario,
          },
          include: { personalizado: { include: { productoBase: true, componentes: { include: { componente: true } } } } },
        });
      }
    });

    // Convertimos todos los campos Decimal a number
    const carritoItem: any = {
      ...result,
      precioUnitario: toNumber(result.precioUnitario),
      personalizado: result.personalizado
        ? {
            ...result.personalizado,
            precioFinal: toNumber(result.personalizado.precioFinal),
            precioTotalPersonalizado: toNumber(precioTotalPersonalizado),
            productoBase: result.personalizado.productoBase,
            componentes: result.personalizado.componentes?.map(c => ({
              ...c,
              componente: c.componente
                ? { ...c.componente, precio: toNumber(c.componente.precio) }
                : undefined
            }))
          }
        : undefined,
    };

    response.status(201).json({
      ...carritoItem,
      precioBaseOriginal: toNumber(precioBase),
      descuento: toNumber(descuento),
      precioBaseConDescuento: toNumber(precioBaseConDescuento),
      precioUnitario: toNumber(precioUnitario),
      precioTotalPersonalizado: toNumber(precioTotalPersonalizado),
      mensaje: "Producto personalizado agregado al carrito correctamente",
    });
  } catch (error) {
    console.error("Error al agregar producto personalizado:", error);
    next(AppError.internalServer("Error al agregar producto personalizado"));
  }
};



  // Actualizar cantidad de un item
  updateQuantity = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const itemId = parseInt(request.params.id);
      const { cantidad } = request.body;

      if (isNaN(itemId)) {
        return next(AppError.badRequest("ID de item inválido"));
      }

      const cantidadFinal = parseInt(cantidad);

      if (isNaN(cantidadFinal)) {
        return next(AppError.badRequest("Cantidad debe ser un número"));
      }

      if (cantidadFinal <= 0) {
        // Si la cantidad es 0 o menos, eliminar el item
        await this.prisma.carritoProducto.delete({
          where: { id: itemId },
        });
        return response.status(204).send();
      }

      const itemActualizado = await this.prisma.carritoProducto.update({
        where: { id: itemId },
        data: { cantidad: cantidadFinal },
        include: {
          producto: true,
          personalizado: true,
        },
      });

      response.json(itemActualizado);
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
      next(AppError.internalServer("Error al actualizar cantidad"));
    }
  };

  // Eliminar item del carrito
  delete = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const itemId = parseInt(request.params.id);

      if (isNaN(itemId)) {
        return next(AppError.badRequest("ID de item inválido"));
      }

      // Verificar que el item existe
      const itemExistente = await this.prisma.carritoProducto.findUnique({
        where: { id: itemId },
      });

      if (!itemExistente) {
        return next(AppError.notFound("Item no encontrado en el carrito"));
      }

      await this.prisma.carritoProducto.delete({
        where: { id: itemId },
      });

      response.status(204).send();
    } catch (error) {
      console.error("Error al eliminar item:", error);
      next(AppError.internalServer("Error al eliminar item del carrito"));
    }
  };

  // Método para vaciar carrito (acción manual)
  clearCart = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const usuarioId = parseInt(request.params.usuarioId);
      if (isNaN(usuarioId)) {
        return next(AppError.badRequest("ID de usuario inválido"));
      }

      // Buscar carrito TEMPORAL o PENDIENTE más reciente
      const carrito = await this.prisma.carrito.findFirst({
        where: {
          usuarioId,
          estado: { in: ["TEMPORAL", "PENDIENTE"] },
        },
        orderBy: { actualizadoEn: "desc" },
      });

      if (!carrito) {
        return next(
          AppError.notFound("No se encontró un carrito activo para vaciar")
        );
      }

      // Eliminar todos los productos asociados
      await this.prisma.carritoProducto.deleteMany({
        where: { carritoId: carrito.id },
      });

      await this.prisma.carrito.update({
        where: { id: carrito.id },
        data: { estado: "TEMPORAL" },
      });

      response.status(200).json({
        success: true,
        message: "Carrito vaciado correctamente",
      });
    } catch (error: unknown) {
      console.error("Error al vaciar carrito:", error);
      next(AppError.internalServer("Error al vaciar carrito"));
    }
  };
}

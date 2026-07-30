import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { PrismaClient } from "../../generated/prisma";
import { Decimal } from "../../generated/prisma/runtime/library";

export class productoController {
  prisma = new PrismaClient();

  get = async (request: Request, response: Response, next: NextFunction) => {
    try {
      // Normalizamos la fecha actual (ignorando horas)
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));

      const productos = await this.prisma.producto.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
        include: {
          categoria: {
            include: {
              promociones: {
                where: {
                  categoriaId: { not: null },
                  // Modifica las condiciones para comparar solo fechas
                  inicio: {
                    lte: new Date(now.setHours(23, 59, 59, 999)), // Fin del día actual
                  },
                  fin: {
                    gte: today, // Inicio del día actual
                  },
                },
                orderBy: { fin: "asc" },
              },
            },
          },
          promociones: {
            where: {
              productoId: { not: null },
              // Misma lógica para promociones de producto
              inicio: {
                lte: new Date(now.setHours(23, 59, 59, 999)),
              },
              fin: {
                gte: today,
              },
            },
            orderBy: { fin: "asc" },
          },
          imagenes: { select: { url: true } },
          etiquetas: { include: { etiqueta: true } },
        },
      });

      const productosFormateados = productos.map((producto) => {
        // Combinar promociones (lógica existente)
        const todasPromociones = [
          ...producto.promociones,
          ...(producto.categoria?.promociones || []),
        ];

        // Ordenar promociones (lógica existente)
        const promocionesOrdenadas = todasPromociones.sort((a, b) => {
          const aEsProducto = a.productoId !== null;
          const bEsProducto = b.productoId !== null;

          if (aEsProducto && !bEsProducto) return -1;
          if (!aEsProducto && bEsProducto) return 1;
          return a.fin.getTime() - b.fin.getTime();
        });

        const promocionRelevante = promocionesOrdenadas[0] || null;

        return {
          ...producto,
          stock: producto.stock ?? 0,
          imagenes: producto.imagenes.map((img) => img.url),
          categoria: producto.categoria?.nombre,
          promocion: promocionRelevante
            ? {
                id: promocionRelevante.id,
                nombre: promocionRelevante.nombre,
                tipo: promocionRelevante.tipo,
                descuento: promocionRelevante.descuento,
                inicio: promocionRelevante.inicio,
                fin: promocionRelevante.fin,
                esDeProducto: promocionRelevante.productoId !== null,
              }
            : null,
        };
      });

      response.json(productosFormateados);
    } catch (error) {
      next(error);
    }
  };

getConComponentesYStock = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const now = new Date();

    const productos = await this.prisma.producto.findMany({
      where: {
        activo: true,
        stock: { gt: 0 }, // Solo productos con stock mayor a 0
        componentes: { some: {} } // Solo productos que tienen al menos un componente
      },
      orderBy: { nombre: 'asc' },
      include: {
        categoria: {
          include: {
            promociones: {
              where: {
                categoriaId: { not: null },
                inicio: { lte: now },
                fin: { gte: now }
              },
              orderBy: { fin: 'asc' }
            }
          }
        },
        promociones: {
          where: {
            productoId: { not: null },
            inicio: { lte: now },
            fin: { gte: now }
          },
          orderBy: { fin: 'asc' }
        },
        imagenes: { select: { url: true } },
        etiquetas: { include: { etiqueta: true } },
        componentes: {
          include: {
            componente: true // Trae todos los campos de Componente, incluido imagenUrl
          }
        }
      }
    });

    const productosFormateados = productos.map(producto => {
      const todasPromociones = [
        ...producto.promociones,
        ...(producto.categoria?.promociones || [])
      ];

      const promocionesVigentes = todasPromociones.filter(promo => {
        const inicio = new Date(promo.inicio);
        const fin = new Date(promo.fin);
        return inicio <= now && fin >= now;
      });

      const promocionRelevante =
        promocionesVigentes.find(promo => promo.productoId !== null) ||
        promocionesVigentes.find(promo => promo.categoriaId !== null) ||
        null;

      let precioConPromocion = new Decimal(producto.precio);

      if (promocionRelevante) {
        if (promocionRelevante.tipo === 'PORCENTAJE') {
          precioConPromocion = precioConPromocion.mul(
            new Decimal(1 - promocionRelevante.descuento / 100)
          );
        } else if (promocionRelevante.tipo === 'MONTO_FIJO') {
          precioConPromocion = precioConPromocion.sub(
            new Decimal(promocionRelevante.descuento)
          );
        }
      }

      return {
        ...producto,
        precioConPromocion: precioConPromocion.toNumber(),
        stock: producto.stock ?? 0,
        imagenes: producto.imagenes.map(img => img.url),
        categoria: producto.categoria?.nombre,
        componentes: producto.componentes.map(pc => ({
          id: pc.componente?.id,
          nombre: pc.componente?.nombre,
          precio: pc.componente?.precio,
          descripcion: pc.componente?.descripcion,
          imagenUrl: pc.componente?.imagenUrl
        })),
        promocion: promocionRelevante
          ? {
              id: promocionRelevante.id,
              nombre: promocionRelevante.nombre,
              tipo: promocionRelevante.tipo,
              descuento: promocionRelevante.descuento,
              inicio: promocionRelevante.inicio,
              fin: promocionRelevante.fin,
              esDeProducto: promocionRelevante.productoId !== null
            }
          : null
      };
    });

    response.json(productosFormateados);
  } catch (error) {
    next(error);
  }
};


  getById = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      // Normalizamos las fechas para comparación diaria
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));

      const idProducto = parseInt(request.params.id);

      if (isNaN(idProducto)) {
        return next(AppError.badRequest("El ID no es válido"));
      }

      const producto = await this.prisma.producto.findUnique({
        where: { id: idProducto },
        include: {
          categoria: {
            include: {
              promociones: {
                where: {
                  categoriaId: { not: null },
                  inicio: { lte: endOfDay }, // Promoción debe empezar antes del fin del día
                  fin: { gte: startOfDay }, // Promoción debe terminar después del inicio del día
                },
                orderBy: { fin: "asc" },
              },
            },
          },
          promociones: {
            where: {
              productoId: { not: null },
              inicio: { lte: endOfDay }, // Misma lógica para promociones de producto
              fin: { gte: startOfDay },
            },
            orderBy: { fin: "asc" },
          },
          imagenes: { select: { url: true, id: true } },
          etiquetas: { include: { etiqueta: true } },
          resenas: {
            where: { oculto: false },
            include: {
              usuario: {
                select: { nombre: true },
              },
            },
          },
          componentes: {
            include: {
              componente: true,
            },
          },
          personalizados: true,
        },
      });

      if (!producto) {
        return next(AppError.notFound("No existe el producto"));
      }

      // Combinar promociones de producto y categoría
      const todasPromociones = [
        ...producto.promociones,
        ...(producto.categoria?.promociones || []),
      ];

      // Ordenar promociones: primero las de producto, luego por fecha de fin más cercana
      const promocionesOrdenadas = todasPromociones.sort((a, b) => {
        const aEsProducto = a.productoId !== null;
        const bEsProducto = b.productoId !== null;

        if (aEsProducto && !bEsProducto) return -1;
        if (!aEsProducto && bEsProducto) return 1;
        return a.fin.getTime() - b.fin.getTime();
      });

      const promocionRelevante = promocionesOrdenadas[0] || null;

      // Formatear respuesta
      const productoFormateado = {
        ...producto,
        imagenes: producto.imagenes.map((img) => ({
          id: img.id,
          url: img.url,
        })),
        categoria: producto.categoria?.nombre,
        promocion: promocionRelevante
          ? {
              id: promocionRelevante.id,
              nombre: promocionRelevante.nombre,
              tipo: promocionRelevante.tipo,
              descuento: promocionRelevante.descuento,
              inicio: promocionRelevante.inicio,
              fin: promocionRelevante.fin,
              esDeProducto: promocionRelevante.productoId !== null,
            }
          : null,
        etiquetas: producto.etiquetas.map((e) => ({
          etiquetaId: e.etiqueta.id,
          etiqueta: e.etiqueta,
        })),
        resenas: producto.resenas.map((r) => ({
          ...r,
          usuario: r.usuario.nombre,
        })),
        componentes: producto.componentes.map((c) => ({
          ...c,
          componente: c.componente,
        })),
      };

      response.json(productoFormateado);
    } catch (error) {
      next(error);
    }
  };

  // Búsqueda por nombre
  /* search = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const termino = request.query.termino;
      if (typeof termino !== 'string' || termino.trim() === '') {
        return next(AppError.badRequest('El término de búsqueda es requerido'));
      }

      const productos = await this.prisma.producto.findMany({
        where: {
          nombre: { contains: termino, mode: 'insensitive' }
        },
        include: {
          categoria: true,
          etiquetas: { include: { etiqueta: true } },
          imagenes: true,
        }
      });

      response.json(productos);
    } catch (error) {
      next(error);
    }
  };
*/
  // Crear nuevo producto
  create = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const body = request.body;

      // Validación básica de campos requeridos
      if (!body.nombre || !body.id_categoria) {
        throw new Error("Nombre y categoría son campos obligatorios");
      }

      // Log para depuración (opcional)
      console.log("Payload recibido:", JSON.stringify(body, null, 2));

      const nuevoProducto = await this.prisma.producto.create({
        data: {
          nombre: body.nombre,
          descripcion: body.descripcion || null, // Permite valores nulos
          precio: Number(body.precio) || 0,
          stock: Number(body.stock) || 0,
          activo: typeof body.activo === "boolean" ? body.activo : true,
          id_categoria: Number(body.id_categoria),

          // Manejo seguro de etiquetas
          etiquetas:
            Array.isArray(body.etiquetas) && body.etiquetas.length > 0
              ? {
                  create: body.etiquetas
                    .filter((id: any) => !isNaN(Number(id))) // Filtra solo números
                    .map((id: number) => ({
                      etiqueta: { connect: { id: Number(id) } },
                    })),
                }
              : undefined,

          // Manejo de imágenes (si es necesario)
          imagenes:
            Array.isArray(body.imagenes) && body.imagenes.length > 0
              ? {
                  create: body.imagenes.map(
                    (imagen: { url: string; esPrincipal?: boolean }) => ({
                      url: imagen.url,
                      esPrincipal: Boolean(imagen.esPrincipal),
                    })
                  ),
                }
              : undefined,
        },
        include: {
          categoria: true,
          etiquetas: {
            include: {
              etiqueta: true,
            },
          },
          imagenes: true,
        },
      });

      response.status(201).json(nuevoProducto);
    } catch (error) {
      console.error("Error al crear producto:", error);
      next(error);
    }
  };

  // Actualizar producto
  update = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const body = request.body;
      const idProducto = parseInt(request.params.id);

      // Validación básica del ID
      if (isNaN(idProducto)) {
        return next(AppError.badRequest("ID de producto inválido"));
      }

      // Verificar existencia del producto
      const productoExistente = await this.prisma.producto.findUnique({
        where: { id: idProducto },
        include: { etiquetas: true, imagenes: true },
      });

      if (!productoExistente) {
        return next(AppError.notFound("Producto no encontrado"));
      }

      // Validar categoría
      const categoriaExistente = await this.prisma.categoria.findUnique({
        where: { id: parseInt(body.id_categoria) },
      });
      if (!categoriaExistente) {
        return next(AppError.badRequest("La categoría especificada no existe"));
      }

      // Validar etiquetas (si se envían)
      if (body.etiquetas && body.etiquetas.length > 0) {
        const etiquetasExistentes = await this.prisma.etiqueta.count({
          where: { id: { in: body.etiquetas } },
        });
        if (etiquetasExistentes !== body.etiquetas.length) {
          return next(AppError.badRequest("Una o más etiquetas no existen"));
        }
      }

      // Procesar imágenes
      const imagenesFinales =
        body.imagenes ||
        productoExistente.imagenes.map((img) => ({
          url: img.url,
        }));

      // Transacción para asegurar integridad
      const productoActualizado = await this.prisma.$transaction(
        async (prisma) => {
          // Eliminar relaciones existentes primero
          await prisma.productoEtiqueta.deleteMany({
            where: { productoId: idProducto },
          });

          return await prisma.producto.update({
            where: { id: idProducto },
            data: {
              nombre: body.nombre,
              descripcion: body.descripcion,
              precio: parseFloat(body.precio),
              stock: parseInt(body.stock),
              activo: Boolean(body.activo),
              id_categoria: parseInt(body.id_categoria),
              etiquetas: {
                create:
                  body.etiquetas?.map((etiquetaId: number) => ({
                    etiqueta: { connect: { id: etiquetaId } },
                  })) || [],
              },
              imagenes: {
                deleteMany: { productoId: idProducto },
                create: imagenesFinales,
              },
            },
            include: {
              categoria: true,
              etiquetas: { include: { etiqueta: true } },
              imagenes: true,
            },
          });
        }
      );

      response.json(productoActualizado);
    } catch (error) {
      console.error("Error detallado en actualización:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      next(AppError.internalServer(`Error detallado: ${errorMessage}`));
    }
  };

  // Eliminar producto
  delete = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const idProducto = parseInt(request.params.id);
      if (isNaN(idProducto)) {
        return next(AppError.badRequest("ID inválido"));
      }

      await this.prisma.producto.delete({ where: { id: idProducto } });
      response.json({ mensaje: "Producto eliminado" });
    } catch (error) {
      next(error);
    }
  };
}

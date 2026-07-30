import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { PrismaClient } from "../../generated/prisma";

export class promocionController {
  prisma = new PrismaClient();

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const promociones = await this.prisma.promocion.findMany({
        orderBy: { inicio: "asc" },
        include: {
          categoria: { select: { nombre: true } },
          producto: { select: { nombre: true } },
        },
      });

      const promocionesConEstado = promociones.map((promocion) => {
        // Normalizar fechas (ignorar horas)
        const fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0);

        const fechaInicio = new Date(promocion.inicio);
        fechaInicio.setHours(0, 0, 0, 0);

        const fechaFin = new Date(promocion.fin);
        fechaFin.setHours(0, 0, 0, 0);

        let estado;
        let color;

        if (fechaActual >= fechaInicio && fechaActual <= fechaFin) {
          estado = "Vigente";
          color = "#FF4D4D";
        } else if (fechaActual > fechaFin) {
          estado = "Aplicado";
          color = "#D3D3D3";
        } else {
          estado = "Pendiente";
          color = "#92d5ecff";
        }

        return {
          ...promocion,
          estado,
          color,
          categoria: promocion.categoria || null,
          producto: promocion.producto || null,
        };
      });

      res.json(promocionesConEstado);
    } catch (error) {
      next(error);
    }
  };

  // Obtener promoción por ID - Versión mejorada manteniendo estructura
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idPromocion = parseInt(req.params.id);
      if (isNaN(idPromocion)) return next(AppError.badRequest("ID inválido"));

      const objPromocion = await this.prisma.promocion.findUnique({
        where: { id: idPromocion },
        include: {
          categoria: { select: { id: true, nombre: true } }, // Agregado id
          producto: { select: { id: true, nombre: true } }, // Agregado id
        },
      });

      if (!objPromocion)
        return next(AppError.notFound("No existe la promoción"));

      let tipoPromocion: string;
      let aplicaNombre: string | null;
      let categoriaId: number | null = null;
      let productoId: number | null = null;

      if (objPromocion.categoria) {
        tipoPromocion = "Categoría";
        aplicaNombre = objPromocion.categoria.nombre;
        categoriaId = objPromocion.categoria.id; // Nuevo
      } else if (objPromocion.producto) {
        tipoPromocion = "Producto";
        aplicaNombre = objPromocion.producto.nombre;
        productoId = objPromocion.producto.id; // Nuevo
      } else {
        tipoPromocion = "Desconocido";
        aplicaNombre = null;
      }

      res.json({
        // Campos existentes (se mantienen igual)
        nombre: objPromocion.nombre,
        tipoPromocion,
        aplica: aplicaNombre,
        descuento: objPromocion.descuento,
        tipoDescuento: objPromocion.tipo,
        fechaInicio: objPromocion.inicio,
        fechaFin: objPromocion.fin,

        // Campos nuevos para el formulario update
        id: objPromocion.id, // Nuevo
        categoriaId, // Nuevo
        productoId, // Nuevo
        inicio: objPromocion.inicio, // Nuevo (mismo que fechaInicio)
        fin: objPromocion.fin, // Nuevo (mismo que fechaFin)
      });
    } catch (error) {
      next(error);
    }
  };

  getProductosByPromocionId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const idPromocion = parseInt(req.params.id);
      if (isNaN(idPromocion)) return next(AppError.badRequest("ID inválido"));

      const promocion = await this.prisma.promocion.findUnique({
        where: { id: idPromocion },
        include: {
          producto: true,
          categoria: true,
        },
      });

      if (!promocion) return next(AppError.notFound("La promoción no existe"));

      let productos = [];

      if (promocion.productoId) {
        const producto = await this.prisma.producto.findUnique({
          where: { id: promocion.productoId },
          include: {
            categoria: { select: { nombre: true } },
            imagenes: true,
          },
        });

        if (producto) productos.push(producto);
      } else if (promocion.categoriaId) {
        productos = await this.prisma.producto.findMany({
          where: { id_categoria: promocion.categoriaId },
          include: {
            categoria: { select: { nombre: true } },
            imagenes: true,
          },
        });
      } else {
        return next(
          AppError.badRequest(
            "La promoción no tiene producto ni categoría asociada"
          )
        );
      }

      if (productos.length === 0) {
        return next(
          AppError.notFound("No hay productos asociados a esta promoción")
        );
      }

      res.json(
        productos.map((producto) => ({
          id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          stock: producto.stock,
          categoria: producto.categoria?.nombre || "Sin categoría",
          imagenes: producto.imagenes.map((img) => img.url), // <--- Aquí se devuelven las URLs
        }))
      );
    } catch (error) {
      next(error);
    }
  };

  // Crear promoción
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nombre, tipo, descuento, inicio, fin, categoriaId, productoId } =
        req.body;

      if (!nombre || !tipo || descuento === undefined || !inicio || !fin) {
        return next(AppError.badRequest("Faltan datos obligatorios"));
      }

      const nuevaPromocion = await this.prisma.promocion.create({
        data: {
          nombre,
          tipo,
          descuento,
          inicio: new Date(inicio),
          fin: new Date(fin),
          categoriaId: categoriaId || null,
          productoId: productoId || null,
        },
      });

      res.status(201).json(nuevaPromocion);
    } catch (error) {
      next(error);
    }
  };
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest("ID inválido"));

      const { nombre, tipo, descuento, inicio, fin, categoriaId, productoId } =
        req.body;
      if (!nombre || !tipo || descuento === undefined || !inicio || !fin) {
        return next(AppError.badRequest("Faltan datos obligatorios"));
      }

      const actualizado = await this.prisma.promocion.update({
        where: { id },
        data: {
          nombre,
          tipo,
          descuento,
          inicio: new Date(inicio),
          fin: new Date(fin),
          categoriaId: categoriaId || null,
          productoId: productoId || null,
        },
      });

      res.json(actualizado);
    } catch (error) {
      next(error);
    }
  }; // Actualizar promoción

  // Eliminar promoción
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest("ID inválido"));

      await this.prisma.promocion.delete({ where: { id } });
      res.json({ mensaje: "Promoción eliminada" });
    } catch (error) {
      next(error);
    }
  };
}

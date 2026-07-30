import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { Componente, PrismaClient } from "../../generated/prisma";
import { Decimal } from "../../generated/prisma/runtime/library";

export class productoPersonalizadoController {
  prisma = new PrismaClient();

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const personalizados = await this.prisma.productoPersonalizado.findMany({
        include: {
          productoBase: true,
          componentes: { include: { componente: true } },
        },
      });
      res.json(personalizados);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest("ID inválido"));

      const personalizado = await this.prisma.productoPersonalizado.findUnique({
        where: { id },
        include: {
          productoBase: true,
          componentes: { include: { componente: true } },
        },
      });

      if (!personalizado)
        return next(AppError.notFound("No existe el personalizado"));

      res.json(personalizado);
    } catch (error) {
      next(error);
    }
  };

  // CREATE corregido
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as {
        productoBaseId: number;
        usuarioId: number;
        componentes: number[] | { id: number }[] | { componenteId: number }[];
        configuracion?: any;
      };

      // Validación básica
      if (!body.productoBaseId || !body.usuarioId) {
        return next(AppError.badRequest("Campos obligatorios faltantes"));
      }

      // Normalizar componentes
      const componentesNormalizados = Array.isArray(body.componentes)
        ? body.componentes.map((c) => {
            if (typeof c === "number") return { componenteId: c };
            if ("id" in c) return { componenteId: c.id };
            if ("componenteId" in c) return { componenteId: c.componenteId };
            throw new Error("Formato de componente inválido");
          })
        : [];

      // Verificar producto base
      const productoBase = await this.prisma.producto.findUnique({
        where: { id: Number(body.productoBaseId) },
      });

      if (!productoBase) {
        return next(AppError.badRequest("Producto base no existe"));
      }

      // Validar componentes
      const componentesIds = componentesNormalizados.map((c) => c.componenteId);
      const componentes = await this.prisma.componente.findMany({
        where: { id: { in: componentesIds } },
      });

      if (componentes.length !== componentesNormalizados.length) {
        return next(AppError.badRequest("Algunos componentes no son válidos"));
      }

      // Calcular precio
      const precioBase = Number(productoBase.precio);
      const precioFinal = componentes.reduce(
        (sum, comp) => sum + Number(comp.precio),
        precioBase
      );

      // Crear producto personalizado con componentes (tabla intermedia incluida)
      const nuevoProductoPersonalizado =
        await this.prisma.productoPersonalizado.create({
          data: {
            productoBaseId: body.productoBaseId,
            usuarioId: body.usuarioId,
            configuracion:
              body.configuracion && typeof body.configuracion === "object"
                ? JSON.stringify(body.configuracion) // solo stringify si es objeto
                : typeof body.configuracion === "string"
                ? body.configuracion
                : "{}",
            precioFinal: Decimal(precioFinal),
            componentes: {
              create: componentesNormalizados,
            },
          },
          include: {
            productoBase: true,
            componentes: {
              include: { componente: true },
            },
          },
        });

      res.status(201).json({
        ...nuevoProductoPersonalizado,
        precioBase,
        precioComponentes: precioFinal - precioBase,
      });
    } catch (error) {
      console.error("Error en create ProductoPersonalizado:", error);
      next(AppError.internalServer("Error al crear producto personalizado"));
    }
  };

  // UPDATE corregido para Prisma puro
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const body = req.body as {
        componentes?: { componenteId: number }[];
        configuracion?: any;
      };

      if (isNaN(id)) {
        return next(AppError.badRequest("ID inválido"));
      }

      // Obtener producto personalizado actual
      const productoActual = await this.prisma.productoPersonalizado.findUnique(
        {
          where: { id },
          include: {
            productoBase: true,
            componentes: true,
          },
        }
      );

      if (!productoActual) {
        return next(AppError.notFound("Producto personalizado no encontrado"));
      }

      const precioBase = Number(productoActual.productoBase.precio);
      let precioFinal = Number(productoActual.precioFinal);
      let componentes: any[] = [];

      if (body.componentes?.length) {
        // Obtener los componentes válidos
        componentes = await this.prisma.componente.findMany({
          where: {
            id: { in: body.componentes.map((c) => Number(c.componenteId)) },
          },
        });

        if (componentes.length !== body.componentes.length) {
          return next(AppError.badRequest("Componentes no válidos"));
        }

        // Calcular precio final
        precioFinal = componentes.reduce(
          (sum, c) => sum + Number(c.precio),
          precioBase
        );
      }

      // Actualizar producto personalizado

      const actualizado = await this.prisma.productoPersonalizado.update({
        where: { id },
        data: {
          configuracion: body.configuracion || productoActual.configuracion,

          precioFinal: body.componentes ? Decimal(precioFinal) : undefined,
          componentes: body.componentes
            ? {
                deleteMany: {}, // eliminar componentes actuales
                create: componentes.map((c) => ({ componenteId: c.id })),
              }
            : undefined,
        },
        include: {
          productoBase: true,
          componentes: { include: { componente: true } },
        },
      });

      res.json({
        ...actualizado,
        precioBase,
        precioComponentes: precioFinal - precioBase,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest("ID inválido"));

      await this.prisma.productoPersonalizado.delete({ where: { id } });
      res.json({ mensaje: "Producto personalizado eliminado" });
    } catch (error) {
      next(error);
    }
  };
}

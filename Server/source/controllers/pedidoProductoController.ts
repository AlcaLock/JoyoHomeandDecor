import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { PrismaClient } from "../../generated/prisma";

export class pedidoProductoController {
  prisma = new PrismaClient();

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.prisma.pedidoProducto.findMany({
        include: {
          pedido: true,
          producto: true,
          personalizado: true,
        }
      });
      res.json(items);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest('ID inválido'));

      const item = await this.prisma.pedidoProducto.findUnique({
        where: { id },
        include: {
          pedido: true,
          producto: true,
          personalizado: true,
        }
      });

      if (!item) return next(AppError.notFound('No existe el pedidoProducto'));

      res.json(item);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      if (!data.pedidoId || (!data.productoId && !data.personalizadoId) || !data.cantidad) {
        return next(AppError.badRequest('Faltan datos obligatorios'));
      }

      const nuevo = await this.prisma.pedidoProducto.create({ data });
      res.status(201).json(nuevo);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest('ID inválido'));

      const actualizado = await this.prisma.pedidoProducto.update({
        where: { id },
        data: req.body,
      });
      res.json(actualizado);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest('ID inválido'));

      await this.prisma.pedidoProducto.delete({ where: { id } });
      res.json({ mensaje: 'PedidoProducto eliminado' });
    } catch (error) {
      next(error);
    }
  };
}

import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { PrismaClient } from "../../generated/prisma";

export class categoriaController {
  prisma = new PrismaClient();

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categorias = await this.prisma.categoria.findMany({
        orderBy: { nombre: 'asc' },
        include: {
          productos: true,
          promociones: true
        }
      });
      res.json(categorias);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest('ID inválido'));

      const categoria = await this.prisma.categoria.findUnique({
        where: { id },
        include: { productos: true, promociones: true }
      });
      if (!categoria) return next(AppError.notFound('No existe la categoría'));

      res.json(categoria);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nombre } = req.body;
      if (!nombre) return next(AppError.badRequest('Nombre es obligatorio'));

      const nueva = await this.prisma.categoria.create({ data: { nombre } });
      res.status(201).json(nueva);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const { nombre } = req.body;
      if (isNaN(id)) return next(AppError.badRequest('ID inválido'));
      if (!nombre) return next(AppError.badRequest('Nombre es obligatorio'));

      const actualizado = await this.prisma.categoria.update({
        where: { id },
        data: { nombre },
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

      await this.prisma.categoria.delete({ where: { id } });
      res.json({ mensaje: 'Categoría eliminada' });
    } catch (error) {
      next(error);
    }
  };
}

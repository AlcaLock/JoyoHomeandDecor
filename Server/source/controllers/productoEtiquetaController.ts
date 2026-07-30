import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { PrismaClient } from "../../generated/prisma";

export class productoEtiquetaController {
  prisma = new PrismaClient();

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lista = await this.prisma.productoEtiqueta.findMany({
        include: { producto: true, etiqueta: true }
      });
      res.json(lista);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productoId = parseInt(req.params.productoId);
      const etiquetaId = parseInt(req.params.etiquetaId);

      if (isNaN(productoId) || isNaN(etiquetaId)) {
        return next(AppError.badRequest('ID inválido'));
      }

      const item = await this.prisma.productoEtiqueta.findUnique({
        where: {
          productoId_etiquetaId: {
            productoId,
            etiquetaId
          }
        },
        include: { producto: true, etiqueta: true }
      });

      if (!item) {
        return next(AppError.notFound('No existe el registro'));
      }

      res.json(item);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productoId, etiquetaId } = req.body;
      if (!productoId || !etiquetaId) {
        return next(AppError.badRequest('Faltan datos obligatorios'));
      }

      const nuevo = await this.prisma.productoEtiqueta.create({
        data: { productoId, etiquetaId }
      });
      res.status(201).json(nuevo);
    } catch (error) {
      next(error);
    }
  };

  

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productoId = parseInt(req.params.productoId);
      const etiquetaId = parseInt(req.params.etiquetaId);

      if (isNaN(productoId) || isNaN(etiquetaId)) {
        return next(AppError.badRequest('ID inválido'));
      }

      await this.prisma.productoEtiqueta.delete({
        where: {
          productoId_etiquetaId: {
            productoId,
            etiquetaId
          }
        }
      });
      res.json({ mensaje: 'Registro eliminado' });
    } catch (error) {
      next(error);
    }
  };
}

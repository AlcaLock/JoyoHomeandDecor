import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { PrismaClient } from "../../generated/prisma";

export class reporteResenaController {
  prisma = new PrismaClient();

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportes = await this.prisma.reporteResena.findMany({
        include: { resena: true, usuarioReporta: true }
      });
      res.json(reportes);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest('ID inválido'));

      const reporte = await this.prisma.reporteResena.findUnique({
        where: { id },
        include: { resena: true, usuarioReporta: true }
      });

      if (!reporte) return next(AppError.notFound('No existe el reporte'));

      res.json(reporte);
    } catch (error) {
      next(error);
    }
  };

  reportar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { resenaId, usuarioReportaId, motivo } = req.body;
      if (!resenaId || !usuarioReportaId || !motivo) {
        return next(AppError.badRequest('Faltan datos obligatorios'));
      }

      const nuevo = await this.prisma.reporteResena.create({
        data: { resenaId, usuarioReportaId, motivo }
      });
      res.status(201).json(nuevo);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest('ID inválido'));

      const actualizado = await this.prisma.reporteResena.update({
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

      await this.prisma.reporteResena.delete({ where: { id } });
      res.json({ mensaje: 'Reporte eliminado' });
    } catch (error) {
      next(error);
    }
  };
}

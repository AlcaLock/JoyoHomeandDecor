import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { AccionModeracion, PrismaClient } from "../../generated/prisma";

export class moderacionResenaController {
  prisma = new PrismaClient();

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const moderaciones = await this.prisma.moderacionResena.findMany({
        include: { resena: true, administrador: true }
      });
      res.json(moderaciones);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest('ID inválido'));

      const moderacion = await this.prisma.moderacionResena.findUnique({
        where: { id },
        include: { resena: true, administrador: true }
      });

      if (!moderacion) return next(AppError.notFound('No existe la moderación'));

      res.json(moderacion);
    } catch (error) {
      next(error);
    }
  };

   create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { resenaId, administradorId, accion, comentario, fecha } = req.body;

      if (!resenaId || !administradorId || !accion) {
        return next(AppError.badRequest('Faltan datos obligatorios: resenaId, administradorId o accion'));
      }

      // Validar que 'accion' sea uno de los valores del enum AccionModeracion
      if (!Object.values(AccionModeracion).includes(accion)) {
        return next(AppError.badRequest('El valor de accion no es válido'));
      }

      const data: any = { resenaId, administradorId, accion };

      if (comentario) data.comentario = comentario;
      if (fecha) data.fecha = new Date(fecha);

      const nuevaModeracion = await this.prisma.moderacionResena.create({
        data,
      });

      res.status(201).json(nuevaModeracion);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest('ID inválido'));

      const actualizado = await this.prisma.moderacionResena.update({
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

      await this.prisma.moderacionResena.delete({ where: { id } });
      res.json({ mensaje: 'Moderación eliminada' });
    } catch (error) {
      next(error);
    }
  };
}

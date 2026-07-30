import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { PrismaClient } from "../../generated/prisma";

export class estadoTransicionController {
  prisma = new PrismaClient();

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const estados = await this.prisma.estadoTransicion.findMany({
        include: { pedido: true, administrador: true }
      });
      res.json(estados);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest('ID inválido'));

      const estado = await this.prisma.estadoTransicion.findUnique({
        where: { id },
        include: { pedido: true, administrador: true }
      });

      if (!estado) return next(AppError.notFound('No existe la transición'));

      res.json(estado);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pedidoId, estado, administradorId } = req.body;
      if (!pedidoId || !estado || !administradorId) {
        return next(AppError.badRequest('Faltan datos obligatorios'));
      }

      const nuevo = await this.prisma.estadoTransicion.create({
        data: { pedidoId, estado, administradorId },
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

      const actualizado = await this.prisma.estadoTransicion.update({
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

      await this.prisma.estadoTransicion.delete({ where: { id } });
      res.json({ mensaje: 'Transición eliminada' });
    } catch (error) {
      next(error);
    }
  };
}

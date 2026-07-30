import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { PrismaClient } from "../../generated/prisma";

export class etiquetaController {
  prisma = new PrismaClient();

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const etiquetas = await this.prisma.etiqueta.findMany({
        orderBy: { nombre: 'asc' },
        include: { productos: true }
      });
      res.json(etiquetas);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest('ID inválido'));

      const etiqueta = await this.prisma.etiqueta.findUnique({
        where: { id },
        include: { productos: true }
      });

      if (!etiqueta) return next(AppError.notFound('No existe la etiqueta'));

      res.json(etiqueta);
    } catch (error) {
      next(error);
    }
  };

create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return next(AppError.badRequest('Nombre es obligatorio'));

    // Verificar si ya existe una etiqueta con ese nombre (insensible a mayúsculas)
    const existente = await this.prisma.etiqueta.findFirst({
      where: {
        nombre: {
          equals: nombre
        }
      }
    });

    if (existente) {
      return next(AppError.badRequest('Ya existe una etiqueta con ese nombre'));
    }

    const nueva = await this.prisma.etiqueta.create({ data: { nombre } });
    res.status(201).json(nueva);
  } catch (error) {
    next(error);
  }
};


  update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, nombre } = req.body;
    if (!id || isNaN(parseInt(id))) return next(AppError.badRequest('ID inválido'));
    if (!nombre) return next(AppError.badRequest('Nombre es obligatorio'));

 // Verificar si ya existe otra etiqueta con ese nombre distinto al actual
    const existente = await this.prisma.etiqueta.findFirst({
      where: {
        nombre: {
          equals: nombre,
        }
      },
    });

    if (existente) {
      return next(AppError.badRequest('Ya existe una etiqueta con ese nombre'));
    }

    const actualizado = await this.prisma.etiqueta.update({
      where: { id: parseInt(id) },
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

      await this.prisma.etiqueta.delete({ where: { id } });
      res.json({ mensaje: 'Etiqueta eliminada' });
    } catch (error) {
      next(error);
    }
  };
}

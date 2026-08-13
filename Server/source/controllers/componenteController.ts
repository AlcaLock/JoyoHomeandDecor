import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { PrismaClient } from "../../generated/prisma";
import path from "path";
import fs from "fs";
import multer from "multer";
import { buildPublicImageUrl } from "../utils/url.utils";

export class componenteController {
  prisma = new PrismaClient();

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const componentes = await this.prisma.componente.findMany({
        include: {
          grupoComponente: true,
          productos: true,
          personalizaciones: true,
        },
      });
      res.json(componentes);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest("ID inválido"));

      const componente = await this.prisma.componente.findUnique({
        where: { id },
        include: {
          grupoComponente: true,
          productos: {
            include: {
              producto: true,
            },
          },
          personalizaciones: true,
        },
      });

      if (!componente) {
        return next(AppError.notFound("Componente no encontrado"));
      }

      res.json(componente);
    } catch (error) {
      next(error);
    }
  };

  getSizeComponents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const componentes = await this.prisma.componente.findMany({
        where: {
          grupoComponenteId: 1, // ID del grupo Tamaño
        },
        include: {
          grupoComponente: true,
          productos: {
            include: {
              producto: true,
            },
          },
        },
      });

      if (!componentes || componentes.length === 0) {
        return next(
          AppError.notFound("No se encontraron componentes de tamaño")
        );
      }

      res.json(componentes);
    } catch (error) {
      next(error);
    }
  };

  getColorComponents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const componentes = await this.prisma.componente.findMany({
        where: {
          grupoComponenteId: 2, // ID del grupo Color
        },
        include: {
          grupoComponente: true,
          productos: {
            include: {
              producto: true,
            },
          },
        },
      });

      if (!componentes || componentes.length === 0) {
        return next(
          AppError.notFound("No se encontraron componentes de color")
        );
      }

      res.json(componentes);
    } catch (error) {
      next(error);
    }
  };

  getMaterialComponents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const componentes = await this.prisma.componente.findMany({
        where: {
          grupoComponenteId: 3, // ID del grupo Material
        },
        include: {
          grupoComponente: true,
          productos: {
            include: {
              producto: true,
            },
          },
        },
      });

      if (!componentes || componentes.length === 0) {
        return next(
          AppError.notFound("No se encontraron componentes de material")
        );
      }

      res.json(componentes);
    } catch (error) {
      next(error);
    }
  };

upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(path.resolve(), "assets/uploads"); // coincide con express.static
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `${Date.now()}${ext}`;
      cb(null, name);
    },
  }),
});


  // Ejemplo de create con imagen
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nombre, descripcion, precio, grupoComponenteId } = req.body;
      if (!nombre || !precio || !grupoComponenteId) {
        return next(AppError.badRequest("Faltan datos obligatorios"));
      }

      let imagenUrl = "componente-not-found";
      if (req.file) {
        imagenUrl = buildPublicImageUrl(req, req.file.filename);
      }

      const nuevo = await this.prisma.componente.create({
        data: {
          nombre,
          descripcion,
          precio,
          grupoComponenteId: Number(grupoComponenteId),
          imagenUrl,
        },
      });

      res.status(201).json(nuevo);
    } catch (error) {
      next(error);
    }
  };

  // Update con imagen
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest("ID inválido"));

      const { nombre, descripcion, precio, grupoComponenteId } = req.body;
      if (!nombre || precio === undefined || !grupoComponenteId) {
        return next(AppError.badRequest("Faltan datos obligatorios"));
      }

      let imagenUrl;
      if (req.file) {
        imagenUrl = buildPublicImageUrl(req, req.file.filename);
      }

      const actualizado = await this.prisma.componente.update({
        where: { id },
        data: {
          nombre,
          descripcion,
          precio: Number(precio),
          grupoComponenteId: Number(grupoComponenteId),
          ...(imagenUrl && { imagenUrl }),
        },
      });

      res.json(actualizado);
    } catch (error: any) {
      if (error.code === "P2025")
        return next(AppError.notFound("Componente no encontrado"));
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest("ID inválido"));

      await this.prisma.componente.delete({ where: { id } });
      res.json({ mensaje: "Componente eliminado" });
    } catch (error) {
      next(error);
    }
  };
}

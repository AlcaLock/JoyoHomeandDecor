import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { PrismaClient } from "../../generated/prisma";
import multer from "multer";
import path from 'path';
import fs from 'fs';
import { buildPublicImageUrl } from "../utils/url.utils";

// Configuración de almacenamiento para multer (modificado para assets/uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(path.resolve(), 'assets/uploads');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

// Filtro para solo aceptar imágenes (se mantiene igual)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg','image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'));
  }
};

// Configuración de multer (se mantiene igual)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB por archivo
  }
}).array('files', 10); // 'files' es el nombre del campo y 10 el máximo de archivos

export class imagenProductoController {
  prisma = new PrismaClient();

  // Método para subir múltiples imágenes (con ajuste en la URL)
  uploadMultiple = async (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async (err) => {
      try {
        // Manejo de errores de multer (se mantiene igual)
        if (err instanceof multer.MulterError) {
          return next(AppError.badRequest(err.message));
        } else if (err) {
          return next(AppError.badRequest(err.message));
        }

        const productoId = parseInt(req.params.productoId);
        if (isNaN(productoId)) {
          return next(AppError.badRequest('ID de producto inválido'));
        }

        // Verificar si se subieron archivos (se mantiene igual)
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
          return next(AppError.badRequest('No se subieron archivos válidos'));
        }

        const files = req.files as Express.Multer.File[];
        const imagenesCreadas = [];

        // Procesar cada archivo (con cambio en la URL)
        for (const file of files) {
          const imagenData = {
            url: buildPublicImageUrl(req, file.filename),
            productoId: productoId
          };

          const imagen = await this.prisma.imagenProducto.create({
            data: imagenData
          });
          imagenesCreadas.push(imagen);
        }

        res.status(201).json({
          success: true,
          message: 'Imágenes subidas correctamente',
          data: imagenesCreadas
        });
      } catch (error) {
        next(error);
      }
    });
  };
// Subir imágenes para un producto
uploadImages = async (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, async (err) => {
    try {
      if (err) return next(err);

      const productoId = parseInt(req.params.productoId);
      const imagesToDelete = JSON.parse(req.body.imagesToDelete || '[]') as number[];

      if (imagesToDelete.length > 0) {
        await this.prisma.imagenProducto.deleteMany({
          where: { id: { in: imagesToDelete }, productoId }
        });
      }

      const files = req.files as Express.Multer.File[];
      const nuevas = files?.length
        ? await Promise.all(files.map(f =>
            this.prisma.imagenProducto.create({
              data: { url: buildPublicImageUrl(req, f.filename), productoId }
            })
          ))
        : [];

      res.json({ success: true, deleted: imagesToDelete, uploaded: nuevas });
    } catch (e) { next(e); }
  });
};

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const imagenes = await this.prisma.imagenProducto.findMany({
        include: { producto: true }
      });
      res.json(imagenes);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest('ID inválido'));

      const imagen = await this.prisma.imagenProducto.findUnique({
        where: { id },
        include: { producto: true }
      });

      if (!imagen) return next(AppError.notFound('No existe la imagen'));

      res.json(imagen);
    } catch (error) {
      next(error);
    }
  };

  
}

import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { PrismaClient } from "../../generated/prisma";

export class productoComponenteController {
  prisma = new PrismaClient();

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lista = await this.prisma.productoComponente.findMany({
        include: { producto: true, componente: true }
      });
      res.json(lista);
    } catch (error) {
      next(error);
    }
  };

getByProductId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id_producto = parseInt(req.params.id_producto);
    if (isNaN(id_producto)) {
      return next(AppError.badRequest('ID de producto inválido'));
    }

    const relaciones = await this.prisma.productoComponente.findMany({
      where: { id_producto },
      include: { componente: true }
    });

    if (!relaciones || relaciones.length === 0) {
      return next(AppError.notFound('No se encontraron relaciones para este producto'));
    }

    // Mapear por tipo de componente
    const tamanos = relaciones.filter(r => r.componente.grupoComponenteId === 1).map(r => r.id_componente);
    const colores = relaciones.filter(r => r.componente.grupoComponenteId === 2).map(r => r.id_componente);
    const materiales = relaciones.filter(r => r.componente.grupoComponenteId === 3).map(r => r.id_componente);

    res.json({
      id_producto,
      tamanos,
      colores,
      materiales
    });

  } catch (error) {
    next(error);
  }
};


getSizesByProductId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id_producto = parseInt(req.params.id_producto);
    
    if (isNaN(id_producto)) {
      return next(AppError.badRequest('ID de producto inválido'));
    }

    const sizes = await this.prisma.productoComponente.findMany({
      where: {
        id_producto,
        componente: {
          grupoComponenteId: 1 // ID del grupo Tamaño
        }
      },
      include: {
        componente: true
      }
    });

    if (!sizes || sizes.length === 0) {
      return next(AppError.notFound('No se encontraron tamaños para este producto'));
    }

    res.json(sizes.map(item => item.componente));
  } catch (error) {
    next(error);
  }
};

getColorsByProductId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id_producto = parseInt(req.params.id_producto);
    
    if (isNaN(id_producto)) {
      return next(AppError.badRequest('ID de producto inválido'));
    }

    const colors = await this.prisma.productoComponente.findMany({
      where: {
        id_producto,
        componente: {
          grupoComponenteId: 2 // ID del grupo Color
        }
      },
      include: {
        componente: true
      }
    });

    if (!colors || colors.length === 0) {
      return next(AppError.notFound('No se encontraron colores para este producto'));
    }

    res.json(colors.map(item => item.componente));
  } catch (error) {
    next(error);
  }
};

getMaterialsByProductId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id_producto = parseInt(req.params.id_producto);
    
    if (isNaN(id_producto)) {
      return next(AppError.badRequest('ID de producto inválido'));
    }

    const materials = await this.prisma.productoComponente.findMany({
      where: {
        id_producto,
        componente: {
          grupoComponenteId: 3 // ID del grupo Material
        }
      },
      include: {
        componente: true
      }
    });

    if (!materials || materials.length === 0) {
      return next(AppError.notFound('No se encontraron materiales para este producto'));
    }

    res.json(materials.map(item => item.componente));
  } catch (error) {
    next(error);
  }
};


create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id_producto, id_componente } = req.body;

    // Validación de campos obligatorios
    if (!id_producto || !id_componente) {
      return next(AppError.badRequest('Faltan datos obligatorios: id_producto e id_componente'));
    }

    // Validación de tipos
    if (typeof id_producto !== 'number' || typeof id_componente !== 'number') {
      return next(AppError.badRequest('Los IDs deben ser números'));
    }

    // Verificar si el producto existe
    const productoExists = await this.prisma.producto.findUnique({
      where: { id: id_producto }
    });

    if (!productoExists) {
      return next(AppError.notFound('El producto no existe'));
    }

    // Verificar si el componente existe
    const componenteExists = await this.prisma.componente.findUnique({
      where: { id: id_componente }
    });

    if (!componenteExists) {
      return next(AppError.notFound('El componente no existe'));
    }

    // Verificar si la relación ya existe
    const existingRelation = await this.prisma.productoComponente.findUnique({
      where: {
        id_producto_id_componente: {
          id_producto,
          id_componente
        }
      }
    });

    if (existingRelation) {
      return next(AppError.badRequest('Esta relación producto-componente ya existe'));
    }

    // Crear la relación
    const nuevo = await this.prisma.productoComponente.create({
      data: { 
        id_producto, 
        id_componente 
      },
      include: {
        producto: true,
        componente: true
      }
    });

    res.status(201).json(nuevo);
  } catch (error) {
    next(error);
  }
};

updateByProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id_producto = parseInt(req.params.id_producto);
    const { tamanos = [], colores = [], materiales = [] } = req.body;

    if (isNaN(id_producto)) {
      return next(AppError.badRequest('ID de producto inválido'));
    }

    // Obtener relaciones actuales
    const existingRelations = await this.prisma.productoComponente.findMany({
      where: { id_producto }
    });

    // Crear un set de IDs actuales por tipo
    const currentIds = existingRelations.map(r => r.id_componente);

    // Todas las nuevas relaciones que queremos tener
    const newIds = [...tamanos, ...colores, ...materiales];

    // Calcular eliminaciones y agregados
    const toDelete = currentIds.filter(id => !newIds.includes(id));
    const toCreate = newIds.filter(id => !currentIds.includes(id));

    // Ejecutar transacción
    const updatedRelations = await this.prisma.$transaction(async (tx) => {
      if (toDelete.length > 0) {
        await tx.productoComponente.deleteMany({
          where: {
            id_producto,
            id_componente: { in: toDelete }
          }
        });
      }

      const created = [];
      for (const id_componente of toCreate) {
        const c = await tx.productoComponente.create({
          data: { id_producto, id_componente },
          include: { componente: true }
        });
        created.push(c);
      }

      return created;
    });

    res.json({ message: 'Relaciones actualizadas', updatedRelations });

  } catch (error) {
    next(error);
  }
};




checkExistingRelations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id_producto, id_componente } = req.query;

    // Validación básica
    if (!id_producto || !id_componente) {
      return next(AppError.badRequest('Se requieren id_producto e id_componente'));
    }

    const productoId = parseInt(id_producto as string);
    const componenteId = parseInt(id_componente as string);

    if (isNaN(productoId)) return next(AppError.badRequest('ID de producto inválido'));
    if (isNaN(componenteId)) return next(AppError.badRequest('ID de componente inválido'));

    // Verificar relación exacta
    const relacionExacta = await this.prisma.productoComponente.findUnique({
      where: {
        id_producto_id_componente: {
          id_producto: productoId,
          id_componente: componenteId
        }
      },
      include: { componente: true }
    });

    // Obtener tipo de componente actual
    const componenteActual = await this.prisma.componente.findUnique({
      where: { id: componenteId },
      select: { grupoComponenteId: true }
    });

    if (!componenteActual) {
      return next(AppError.notFound('Componente no encontrado'));
    }

    // Buscar relaciones del mismo tipo
    const relacionesMismoTipo = await this.prisma.productoComponente.findMany({
      where: {
        id_producto: productoId,
        componente: {
          grupoComponenteId: componenteActual.grupoComponenteId,
          NOT: { id: componenteId }
        }
      },
      include: { componente: true }
    });

    res.json({
      existe: !!relacionExacta,
      relaciones: relacionesMismoTipo
    });

  } catch (error) {
    next(error);
  }
};


}

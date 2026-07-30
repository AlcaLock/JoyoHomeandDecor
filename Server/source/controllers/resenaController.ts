import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import { AccionModeracion, EstadoPedido, PrismaClient } from "../../generated/prisma";

export class resenaController {
  prisma = new PrismaClient();

  // Obtener todas las reseñas (incluye usuario y producto)
 get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resenas = await this.prisma.resena.findMany({
      where: { activo: true,
        oculto: false
       }, 
      include: {
        usuario: { select: { nombre: true } },
        producto: { select: { nombre: true } },
      },
    });
    res.json(resenas);
  } catch (error) {
    next(error);
  }
};


  // Obtener reseña por ID
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest("ID inválido"));

      const resena = await this.prisma.resena.findUnique({
        where: { id },
        include: {
          reportes: true,
          usuario: { select: { nombre: true } },
          producto: { select: { nombre: true } },
        },
      });

      if (!resena) return next(AppError.notFound("No existe la reseña"));

      res.json({
        id: resena.id,
        usuario: resena.usuario.nombre,
        producto: resena.producto.nombre,
        fecha: resena.fecha,
        comentario: resena.comentario,
        valoracion: resena.estrellas,
      });
    } catch (error) {
      next(error);
    }
  };

  // Crear nueva reseña (cliente que haya comprado)
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { usuarioId, productoId, comentario, estrellas } = req.body;
      if (!usuarioId || !productoId || !comentario || estrellas === undefined) {
        return next(AppError.badRequest("Faltan datos obligatorios xd"));
      }

      // Validar rol
      const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
      if (!usuario || usuario.rol !== "CLIENTE") {
        return next(AppError.forbidden("Solo los clientes pueden dejar reseñas"));
      }

      // Validar compra previa
      const haComprado = await this.prisma.pedido.findFirst({
        where: {
          clienteId: usuarioId,
          productos: { some: { productoId } },
        },
      });
      if (!haComprado) {
        return next(AppError.badRequest("Debes comprar el producto antes de reseñarlo"));
      }

      // Validar duplicado
      const yaExiste = await this.prisma.resena.findUnique({
        where: { usuarioId_productoId: { usuarioId, productoId } },
      });
      

      const nuevaResena = await this.prisma.resena.create({
        data: {
          usuarioId,
          productoId,
          comentario,
          estrellas,
          fecha: new Date(),
          oculto: false,
        },
      });

      res.status(201).json(nuevaResena);
    } catch (error) {
      next(error);
    }
  };

 // Actualizar reseña
update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const { comentario, estrellas, oculto, activo } = req.body;

    if (isNaN(id)) return next(AppError.badRequest("ID inválido"));
    if (
      comentario === undefined &&
      estrellas === undefined &&
      oculto === undefined &&
      activo === undefined
    ) {
      return next(AppError.badRequest("No hay datos para actualizar"));
    }

    const actualizado = await this.prisma.resena.update({
      where: { id },
      data: {
        ...(comentario !== undefined && { comentario }),
        ...(estrellas !== undefined && { estrellas }),
        ...(oculto !== undefined && { oculto }),
        ...(activo !== undefined && { activo }), // 👈 se incluye si viene
      },
    });

    res.json(actualizado);
  } catch (error) {
    next(error);
  }
};


  // Eliminar (soft delete) reseña
delete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(AppError.badRequest("ID inválido"));

    await this.prisma.resena.update({
      where: { id },
      data: { activo: false },
    });

    res.json({ mensaje: "Reseña desactivada" });
  } catch (error) {
    next(error);
  }
};


  // Obtener reseñas visibles por producto (con filtro opcional de estrellas)


// Verifica si un usuario puede dejar reseña sobre un producto
puedeResenar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = parseInt(req.params.usuarioId);
    const productoId = parseInt(req.params.productoId);

    console.log(`Verificando reseña para usuario ${usuarioId} y producto ${productoId}`); // Debug

    if (isNaN(usuarioId) || isNaN(productoId)) {
      console.log('IDs inválidos recibidos'); // Debug
      return next(AppError.badRequest("ID de usuario o producto inválido"));
    }

    // 1. Verificar que el usuario existe y es cliente
    const usuario = await this.prisma.usuario.findUnique({ 
      where: { id: usuarioId },
      select: { id: true, rol: true } // Solo necesitamos estos campos
    });
    
    if (!usuario || usuario.rol !== "CLIENTE") {
      console.log('Usuario no encontrado o no es cliente'); // Debug
      return next(AppError.forbidden("Solo los clientes pueden reseñar"));
    }

    // 2. Verificar si el usuario ha comprado el producto (pedido completado)
    const haComprado = await this.prisma.pedido.findFirst({
      where: {
        clienteId: usuarioId,
        estado: EstadoPedido.ENTREGADO, // Asegurar que el pedido está completado
        productos: {
          some: {
            productoId: productoId,
            cantidad: { gt: 0 } // Que haya comprado al menos 1 unidad
          }
        }
      },
      select: { id: true } // Solo necesitamos saber si existe
    });

    console.log('Resultado de haComprado:', haComprado); // Debug

    if (!haComprado) {
      return res.json({ 
        puedeResenar: false, 
        razon: "No ha comprado este producto o el pedido no está completado"
      });
    }

    // 3. Verificar si ya existe reseña
    const yaExiste = await this.prisma.resena.findUnique({
      where: {
        usuarioId_productoId: { usuarioId, productoId },
      },
      select: { id: true } // Solo necesitamos saber si existe
    });

    console.log('Resultado de yaExiste:', yaExiste); // Debug

    if (yaExiste) {
      return res.json({ 
        puedeResenar: false, 
        razon: "Ya ha reseñado este producto" 
      });
    }

    // Si pasa todas las validaciones
    return res.json({ puedeResenar: true });
    
  } catch (error) {
    console.error('Error en puedeResenar:', error); // Debug
    next(error);
  }
};

// GET /resena/:resenaId/ya-reportada/:usuarioId
yaReportada = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resenaId = Number(req.params.resenaId);
    const usuarioId = Number(req.params.usuarioId);
    if (isNaN(resenaId) || isNaN(usuarioId)) {
      return next(AppError.badRequest('IDs inválidos'));
    }

    const reporte = await this.prisma.reporteResena.findFirst({
      where: { resenaId, usuarioReportaId: usuarioId },
    });

    res.json({ yaReportada: !!reporte });
  } catch (error) {
    next(error);
  }
};



  // Reportar reseña
reportar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('req.body:', req.body);  
    const { resenaId, usuarioId, motivo } = req.body;

    // Validar datos
    if (!resenaId || !usuarioId || !motivo) {
      return next(AppError.badRequest("Faltan datos obligatorios para el reporte"));
    }

    // Verificar que la reseña exista
    const resena = await this.prisma.resena.findUnique({
      where: { id: resenaId },
    });
    if (!resena) {
      return next(AppError.notFound("La reseña no existe"));
    }

    // Verificar si la reseña ya ha sido reportada por alguien (una vez máximo)
    const yaFueReportada = await this.prisma.reporteResena.findFirst({
      where: { resenaId },
    });
    if (yaFueReportada) {
      if (yaFueReportada.usuarioReportaId === usuarioId) {
        return next(AppError.badRequest("Ya has reportado esta reseña."));
      } else {
        return next(AppError.badRequest("Esta reseña ya fue reportada."));
      }
    }

    // Crear el reporte
    const reporte = await this.prisma.reporteResena.create({
      data: {
        resenaId,
        usuarioReportaId: usuarioId,
        motivo,
      },
    });

    res.status(201).json(reporte);
  } catch (error) {
    next(error);
  }
};



moderar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const { estado, administradorId, comentario } = req.body;  // ojo aquí, viene "estado"


    // Según estado: true = eliminar, false = restaurar
    // Si eliminar => activo = false, oculto = true
    // Si restaurar => activo = true, oculto = false
    const oculto = estado;  
    const activo = !estado;

    // Actualizar reseña con ambos campos
    const actualizada = await this.prisma.resena.update({
      where: { id },
      data: {
        oculto,
        activo,
      }
    });

    // Actualizar reportes relacionados
    await this.prisma.reporteResena.updateMany({
      where: {
        resenaId: id,
        estado: 'PENDIENTE',
      },
      data: {
        estado: estado ? 'ACEPTADO' : 'RECHAZADO',
      },
    });

    // Registrar acción de moderación
    await this.prisma.moderacionResena.create({
      data: {
        resenaId: id,
        administradorId,
        comentario,
        accion: estado ? 'MANTENER' : 'OCULTAR',  
        fecha: new Date(),
      },
    });

    res.json(actualizada);
  } catch (error) {
    next(error);
  }
};

cambiarEstadoReportes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resenaId } = req.params;
    const { estado } = req.body; // 'RECHAZADO' | 'ACEPTADO'

    // Validaciones...

    // Actualizar reportes de esa reseña con estado PENDIENTE
    await this.prisma.reporteResena.updateMany({
      where: {
        resenaId: Number(resenaId),
        estado: 'PENDIENTE',
      },
      data: {
        estado,
      }
    });

    res.json({ mensaje: "Estado de reportes actualizado" });
  } catch (error) {
    next(error);
  }
}



  // Obtener reseñas ocultas (para admin)
  getModeradas = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      
      const resenas = await this.prisma.resena.findMany({
         where: {
        reportes: {
          some: {
            estado: "PENDIENTE"
          }
        }
      },
        include: {
          usuario: { select: { nombre: true } },
          producto: { select: { nombre: true } },
        },
      });

      res.json(resenas);
    } catch (error) {
      next(error);
    }
  };


// Traer reseñas reportadas (aunque no estén ocultas)
getReportadas = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const resenas = await this.prisma.resena.findMany({
      where: {
        activo: true,
        reportes: {
          some: {
            estado: "PENDIENTE"
          }
        }
      , // reseñas que tienen al menos un reporte
      },
      include: {
        usuario: { select: { nombre: true } },
        producto: { select: { nombre: true } },
        reportes: {
          include: {
            usuarioReporta: {
              select: { nombre: true }, 
            },
          },
        },
      },
    });

    res.json(resenas);
  } catch (error) {
    next(error);
  }
};

  // Estadísticas por producto
  estadisticas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productoId = parseInt(req.params.productoId);
      if (isNaN(productoId)) return next(AppError.badRequest("ID de producto inválido"));

      const porEstrellas = await this.prisma.resena.groupBy({
        by: ['estrellas'],
        where: { productoId, oculto: false },
        _count: true,
      });

      const promedio = await this.prisma.resena.aggregate({
        where: { productoId, oculto: false },
        _avg: { estrellas: true },
      });

      res.json({
        promedio: promedio._avg.estrellas ?? 0,
        detalle: porEstrellas.map(e => ({
          estrellas: e.estrellas,
          cantidad: e._count,
        })),
      });
    } catch (error) {
      next(error);
    }
  };
}

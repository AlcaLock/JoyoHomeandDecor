import { RequestHandler, Router } from "express";
import { resenaController } from "../controllers/resenaController";

export class ResenaRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new resenaController();

    router.get("/puede-resenar/:usuarioId/:productoId", controller.puedeResenar as RequestHandler);

    router.get("/moderadas", controller.getModeradas as RequestHandler);       
    router.get("/reportadas", controller.getReportadas as RequestHandler);    
    router.get("/", controller.get);
    router.get("/ya-reportada/:resenaId/:usuarioId", controller.yaReportada as RequestHandler);
    router.patch("/:resenaId/estado", controller.cambiarEstadoReportes as RequestHandler);
    router.post("/", controller.create);
    router.post("/reporte-resena", controller.reportar as RequestHandler);
    router.put("/:id", controller.update);
    router.put("/moderar/:id", controller.moderar as RequestHandler);
    router.delete("/:id", controller.delete);

router.get("/:id", controller.getById);
    return router;
  }
}

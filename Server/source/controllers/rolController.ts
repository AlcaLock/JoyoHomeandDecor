import { PrismaClient, Rol } from "../../generated/prisma";;
import { Request, Response, NextFunction } from "express";

export class RolController {
  prisma = new PrismaClient();
  get = async (request: Request, response: Response, next: NextFunction) => {
    let listRoles = [];
    for (let element in Rol) {
      switch (element) {
        case Rol.ADMIN:
          listRoles.unshift({
            ["id"]: element,
            ["nombre"]: "Administrador",
          });
          break;
        case Rol.CLIENTE:
          listRoles.unshift({
            ["id"]: element,
            ["nombre"]: "Usuario",
          });
          break;
        default:
          listRoles.unshift({ ["id"]: Rol.CLIENTE, ["nombre"]: "Usuario" });
          break;
      }
    }

    response.json(listRoles);
  };
  getById = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    let id = request.params.id;
    let nombre = "";
    switch (Rol [id as Rol]) {
      case Rol.ADMIN:
        nombre = "Administrador";
        break;
      case Rol.CLIENTE:
        nombre = "Usuario";
        break;
      default:
        nombre = "Usuario";
        break;
    }
    let rol = { ["id"]: Rol[id as Rol], ["nombre"]: nombre };
    response.json(rol);
  };
}

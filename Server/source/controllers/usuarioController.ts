import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error";
import bcrypt from "bcryptjs";
import { PrismaClient, Rol, Usuario } from "../../generated/prisma";
import passport from "passport";
import {
  generateResetToken,
  generateToken,
  verifyToken,
} from "../config/authUtils";
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";

export class usuarioController {
  private prisma = new PrismaClient();

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarios = await this.prisma.usuario.findMany({});
      res.json(usuarios);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest("ID inválido"));

      const usuario = await this.prisma.usuario.findUnique({
        where: { id },
      });

      if (!usuario) return next(AppError.notFound("No existe el usuario"));

      res.json(usuario);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest("ID inválido"));

      const { nombre, correo } = req.body;

      // Validar que existe el usuario
      const existe = await this.prisma.usuario.findUnique({ where: { id } });
      if (!existe) return next(AppError.notFound("Usuario no encontrado"));

      // Preparamos datos para actualizar
      const data: any = {};
      if (nombre) data.nombre = nombre;
      if (correo) data.correo = correo;

      const actualizado = await this.prisma.usuario.update({
        where: { id },
        data,
      });

      res.json({
        success: true,
        message: "Usuario actualizado correctamente",
        data: actualizado,
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        return next(AppError.badRequest("El correo ya está en uso"));
      }
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return next(AppError.badRequest("ID inválido"));

      await this.prisma.usuario.delete({ where: { id } });
      res.json({ mensaje: "Usuario eliminado" });
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nombre, correo, contrasenna, rol } = req.body;

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(contrasenna, salt);

      const user = await this.prisma.usuario.create({
        data: {
          nombre,
          correo,
          contrasena: hash,
          rol: Rol[rol as keyof typeof Rol],
        },
      });

      res.status(201).json({
        success: true,
        message: "Usuario creado",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

login = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    "local",
    { session: false },
    async (
      err: Error | null,
      user: Express.User | false | null,
      info: { message?: string }
    ) => {
      if (err) return next(err);
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: info.message });
      }

      const usuario = user as Usuario;
      const token = generateToken(usuario);

      try {
        // ACTUALIZAR EL ÚLTIMO LOGIN en la base de datos
        const usuarioActualizado = await this.prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            ultimoLogin: new Date() // Actualizar con la fecha/hora actual
          },
          select: {
            id: true,
            nombre: true,
            correo: true,
            rol: true,
            isTempPassword: true,
            ultimoLogin: true,
            creadoEn: true
          }
        });

        return res.json({
          success: true,
          message: "Inicio de sesión exitoso",
          token,
          requirePasswordChange: usuarioActualizado.isTempPassword || false,
          usuario: usuarioActualizado
        });

      } catch (error) {
        return next(error);
      }
    }
  )(req, res, next);
};

  userAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = req.user as Usuario;
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { correo } = req.body;

      if (!correo) return next(AppError.badRequest("El correo es obligatorio"));

      const user = await this.prisma.usuario.findUnique({ where: { correo } });
      if (!user) return next(AppError.notFound("Usuario no encontrado"));

      // Verifica que las variables de entorno existan
      if (
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASS ||
        !process.env.FRONTEND_URL
      ) {
        return next(
          AppError.internalServer(
            "Variables de entorno de correo no configuradas"
          )
        );
      }

      // Generar token usando authUtils
      const token = generateResetToken(user.id);
      const resetLink = `${process.env.FRONTEND_URL.replace(
        /\/$/,
        ""
      )}/usuario/reset-password?token=${token}`;

      // Configurar nodemailer
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Enviar correo
      const info = await transporter.sendMail({
        from: `"Soporte JoyoH&D" <${process.env.EMAIL_USER}>`,
        to: user.correo,
        subject: "Recuperación de contraseña",
        html: `
        <p>Hola ${user.nombre},</p>
        <p>Haz clic en este enlace para resetear tu contraseña:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Este enlace expirará en 1 hora.</p>
      `,
      });

      console.log("Correo enviado:", info);

      res.json({
        success: true,
        message: "Si el correo coincide le llegara un correo de recuperación",
      });
    } catch (error) {
      console.error("Error enviando correo:", error);
    }
  };

  // Reseteo con token
resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, nuevaContrasenna } = req.body;
    if (!token) return next(AppError.badRequest("Token requerido"));

    const payload: any = verifyToken(token);

    const hash = await bcrypt.hash(nuevaContrasenna, 10);

    await this.prisma.usuario.update({
      where: { id: payload.userId },
      data: { contrasena: hash, isTempPassword: false },
    });

    res.json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch (error) {
    return next(AppError.badRequest("Token inválido o expirado"));
  }
};

// Reseteo de contraseña temporal
resetTempPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, nuevaContrasenna } = req.body;
    if (!userId) return next(AppError.badRequest("UserId requerido"));

    const usuario = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) return next(AppError.notFound("Usuario no encontrado"));

    const hash = await bcrypt.hash(nuevaContrasenna, 10);

    await this.prisma.usuario.update({
      where: { id: userId },
      data: { contrasena: hash, isTempPassword: false },
    });

    res.json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch (error) {
    next(error);
  }
};


  adminResetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params; // id del usuario a resetear
      if (!id) return next(AppError.badRequest("ID de usuario requerido"));

      const user = await this.prisma.usuario.findUnique({
        where: { id: parseInt(id) },
      });
      if (!user) return next(AppError.notFound("Usuario no encontrado"));

      // Generar contraseña temporal
      const tempPassword = randomBytes(4).toString("hex");
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Actualizar contraseña en DB
      await this.prisma.usuario.update({
        where: { id: parseInt(id) },
        data: { contrasena: hashedPassword, isTempPassword: true },
      });

      // Verificar variables de entorno para correo
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return next(
          AppError.internalServer(
            "Variables de entorno de correo no configuradas"
          )
        );
      }

      // Enviar correo al usuario
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: `"Soporte JoyoH&D" <${process.env.EMAIL_USER}>`,
        to: user.correo,
        subject: "Contraseña temporal generada",
        html: `
        <p>Hola ${user.nombre},</p>
        <p>Tu administrador ha generado una contraseña temporal para tu cuenta:</p>
        <p><b>${tempPassword}</b></p>
         <a href="http://localhost:4200/usuario/login">Login</a>
        <p>Por seguridad, te recomendamos cambiarla al iniciar sesión.</p>
      `,
      });

      res.json({
        success: true,
        message: "Contraseña temporal enviada por correo",
      });
    } catch (error) {
      next(error);
    }
  };
}

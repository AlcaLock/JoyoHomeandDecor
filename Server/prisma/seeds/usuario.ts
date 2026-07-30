import { Rol } from "../../generated/prisma";

export const usuarios = [
  { nombre: 'Camila Rojas', correo: 'camila.rojas@ejemplo.com', contrasena: 'camila123', rol: Rol.CLIENTE },
  { nombre: 'Esteban Mora', correo: 'esteban.mora@ejemplo.com', contrasena: 'esteban123', rol: Rol.CLIENTE },
  { nombre: 'Valeria Méndez', correo: 'valeria.mendez@ejemplo.com', contrasena: 'valeria123', rol: Rol.CLIENTE },
  { nombre: 'Luis Navarro', correo: 'luis.navarro@ejemplo.com', contrasena: 'luis123', rol: Rol.CLIENTE },
  { nombre: 'Sofía González', correo: 'sofia.gonzalez@ejemplo.com', contrasena: 'sofia123', rol: Rol.CLIENTE },
];

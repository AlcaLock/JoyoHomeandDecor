import { sign, Secret, SignOptions, verify } from "jsonwebtoken";
import { Rol } from "../../generated/prisma";

export function generateToken(user: {
  id: number;
  correo: string;
  rol: Rol;
}): string {
  const secretKey = process.env.SECRET_KEY;

  if (!secretKey) {
    throw new Error("SECRET_KEY no esta definido en la variables de entorno");
  }
  const jwtSecret: Secret = secretKey;
  const jwtOptions: SignOptions = {
    expiresIn: "1h",
  };

  const payload = {
    id: user.id,
    email: user.correo,
    role: user.rol,
  };
  try {
    return sign(payload, jwtSecret, jwtOptions);
  } catch (error) {
    console.error("Error creando JWT:", error);
    throw new Error("Fallo al genera JWT.");
  }
}
  export function generateResetToken(userId: number): string {
  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) throw new Error("SECRET_KEY no está definido en las variables de entorno");

  const jwtSecret: Secret = secretKey;
  const jwtOptions: SignOptions = { expiresIn: "1h" };

  const payload = { userId };
  return sign(payload, jwtSecret, jwtOptions);
}

// Función para verificar cualquier token
export function verifyToken(token: string): any {
  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) throw new Error("SECRET_KEY no está definido en las variables de entorno");

  return verify(token, secretKey);
}


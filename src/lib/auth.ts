import { jwtVerify } from "jose";

export const JWT_COOKIE_NAME = "jwt";

export interface JwtPayload {
  id: string;
  username: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SECRET_KEY;
  if (!secret) {
    throw new Error("SECRET_KEY manquante dans les variables d'environnement");
  }
  return new TextEncoder().encode(secret);
}

// Le Grand Quizz ne gère pas ses propres comptes : le JWT est émis par
// VGAMES (même SECRET_KEY, même cookie httpOnly `jwt`) et seulement vérifié
// ici — contrairement à VGAMES, pas de re-vérification en base (pas de
// modèle User local, voir prisma/schema.prisma).
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.id !== "string" || typeof payload.username !== "string") {
      return null;
    }
    return { id: payload.id, username: payload.username };
  } catch {
    return null;
  }
}

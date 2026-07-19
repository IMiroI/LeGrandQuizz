import { cookies } from "next/headers";
import { cache } from "react";
import { verifyJwt, JWT_COOKIE_NAME, type JwtPayload } from "./auth";

export type PublicUser = JwtPayload;

// En cache par requête (React `cache`) : le JWT ne porte que {id, username},
// donc contrairement à VGAMES il n'y a pas d'appel Prisma ici — juste une
// vérification de signature. Si un profil plus riche (avatar, niveau...) est
// nécessaire côté UI, il faudra un appel réseau vers VGAMES (`/api/auth/verify`)
// plutôt qu'une lecture locale.
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const token = (await cookies()).get(JWT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJwt(token);
});

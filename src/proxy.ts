import { NextRequest, NextResponse } from "next/server";
import { verifyJwt, JWT_COOKIE_NAME } from "@/lib/auth";

// Les joueurs qui rejoignent une salle (/join) n'ont pas besoin de compte —
// seuls la création/gestion de quiz et l'hébergement de partie exigent le
// SSO VGAMES, comme dans l'ancienne app Express (authGuard côté Angular).
export const config = {
  matcher: ["/quizzes/:path*", "/host/:path*", "/api/quizzes/:path*"],
};

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(JWT_COOKIE_NAME)?.value;
  const payload = token ? await verifyJwt(token) : null;

  if (payload) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", req.url));
}

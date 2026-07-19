import { NextResponse } from "next/server";

// Relais same-origin vers VGAMES : le routeur interne de Next.js
// (utilisé via le serveur custom) relativise systématiquement les
// redirections émises depuis proxy.ts, même vers une origine externe —
// constaté en test (Location réécrite en "/login" au lieu de l'URL VGAMES
// complète). Une redirection émise par une route normale ne subit pas
// cette réécriture, donc proxy.ts renvoie ici (même origine) et c'est
// cette route qui fait le saut cross-origin vers VGAMES.
export function GET() {
  return NextResponse.redirect(`${process.env.VGAMES_URL}/login`);
}

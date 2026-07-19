import { createServer } from "node:http";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import next from "next";
import { Server } from "socket.io";
import { verifyJwt, JWT_COOKIE_NAME } from "./src/lib/auth";

const dev = process.env.NODE_ENV !== "production";

// Charge .env explicitement avant tout le reste : avec le serveur custom
// (Next.js piloté par tsx plutôt que par le CLI `next dev`), le proxy
// (src/proxy.ts) compilait sinon avant que Next n'ait fini de charger .env
// en interne et voyait des variables vides (constaté avec VGAMES_URL).
loadEnvConfig(process.cwd(), dev);

const port = Number(process.env.PORT) || 3001;
const app = next({ dev });
const handle = app.getRequestHandler();

function parseCookies(header: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  header.split(";").forEach((part) => {
    const [key, ...rest] = part.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(rest.join("="));
  });
  return cookies;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new Server(httpServer, {
    cors: { origin: process.env.APP_URL ?? `http://localhost:${port}`, credentials: true },
  });

  // Vérifie le même cookie JWT VGAMES que le reste de l'app (voir
  // src/lib/auth.ts et src/proxy.ts) — les joueurs invités sans compte
  // rejoignent avec un pseudo côté client, cette vérification ne concerne
  // que les connexions authentifiées (création/hébergement de quiz).
  io.use(async (socket, next) => {
    const header = socket.handshake.headers.cookie ?? "";
    const token = parseCookies(header)[JWT_COOKIE_NAME];
    const payload = token ? await verifyJwt(token) : null;
    socket.data.user = payload;
    next();
  });

  // TODO : moteur de jeu temps réel (salles, manches, scores) — prochaine
  // étape, une fois le squelette Next.js + SSO validé.
  io.on("connection", (socket) => {
    console.log("Socket connecté", socket.id, "| VGAMES user:", socket.data.user?.username ?? "invité");
  });

  httpServer.listen(port, () => {
    console.log(`Le Grand Quizz — http://localhost:${port}`);
  });
});

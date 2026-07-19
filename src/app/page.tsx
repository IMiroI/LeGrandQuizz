import Link from "next/link";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-extrabold tracking-widest text-gold-ink uppercase">
        VGAMES
      </span>
      <h1 className="font-display text-5xl uppercase tracking-wide text-balance sm:text-6xl">
        Le Grand <span className="text-coral">Quizz</span>
      </h1>
      <p className="max-w-md text-ink-soft">
        Créez et animez des quiz en temps réel : QCM, réponses libres, grilles,
        vols de points, élimination — jusqu&apos;à dix manches par partie.
      </p>

      {user ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-ink-soft">
            Connecté en tant que <strong className="text-ink">{user.username}</strong>
          </p>
          <Link
            href="/quizzes"
            className="rounded-xl bg-gold px-6 py-3 font-extrabold text-gold-ink"
          >
            Voir mes quiz
          </Link>
        </div>
      ) : (
        <Link
          href="/login"
          className="rounded-xl bg-gold px-6 py-3 font-extrabold text-gold-ink"
        >
          Se connecter avec VGAMES
        </Link>
      )}
    </main>
  );
}

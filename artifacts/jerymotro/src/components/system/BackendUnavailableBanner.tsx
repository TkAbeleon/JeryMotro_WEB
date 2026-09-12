import { ServerOff } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

const messages = {
  fr: {
    title: "JeryMotro est actuellement indisponible",
    description:
      "Le serveur n’est actuellement pas disponible. Les services de la plateforme, y compris la connexion, ne sont pas accessibles pour le moment.",
  },
  mg: {
    title: "Tsy azo ampiasaina amin’izao fotoana izao i JeryMotro",
    description:
      "Tsy mandeha amin’izao fotoana izao ny serveur. Noho izany dia tsy azo ampiasaina ny serivisy rehetra amin’ny sehatra, anisan’izany ny fidirana.",
  },
  en: {
    title: "JeryMotro is currently unavailable",
    description:
      "The server is currently unavailable. As a result, the platform services, including sign-in, are not accessible at the moment.",
  },
} as const;

export function BackendUnavailableBanner() {
  const { lang } = useI18n();
  const message = messages[lang];

  return (
    <aside
      role="status"
      aria-live="polite"
      className="border-b border-primary/20 bg-primary/5 px-4 py-3 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3 text-sm">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ServerOff className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{message.title}</p>
          <p className="mt-0.5 leading-relaxed text-muted-foreground">
            {message.description}
          </p>
        </div>
      </div>
    </aside>
  );
}

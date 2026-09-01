import { useI18n } from "@/hooks/use-i18n";

interface LoadingPageProps {
  message?: string;
}

export default function LoadingPage({ message }: LoadingPageProps) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.035] blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <div className="absolute inset-1 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10" />
            <img src="/logo.png" alt="JeryMotro" className="relative h-10 w-10 object-contain" />
          </div>
          <div className="min-w-0">
            <div className="font-heading text-base font-semibold tracking-tight">JeryMotro</div>
            <div className="text-xs text-muted-foreground">Surveillance des feux de brousse</div>
          </div>
        </div>

        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary via-primary to-accent animate-[loading_1.6s_ease-in-out_infinite]" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{message ?? t("common.loading")}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Préparation de votre espace de surveillance…</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-pulse [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse [animation-delay:300ms]" />
          <span className="ml-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Connexion sécurisée</span>
        </div>
      </div>

      <style>{`@keyframes loading { 0%, 100% { transform: translateX(-120%); opacity: .45; } 50% { transform: translateX(250%); opacity: 1; } }`}</style>
    </div>
  );
}

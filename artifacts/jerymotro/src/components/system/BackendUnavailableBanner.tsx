import { ServerOff } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

export function BackendUnavailableBanner() {
  const { t } = useI18n();

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
          <p className="font-semibold text-foreground">
            {t("system.backendUnavailable.title")}
          </p>
          <p className="mt-0.5 text-muted-foreground leading-relaxed">
            {t("system.backendUnavailable.description")}
          </p>
        </div>
      </div>
    </aside>
  );
}

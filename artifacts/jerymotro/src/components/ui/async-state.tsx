import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AsyncStateProps {
  type: "loading" | "empty" | "error";
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const defaults = {
  loading: {
    title: "Chargement en cours",
    description: "Les données sont en train d’être récupérées.",
  },
  empty: {
    title: "Aucune donnée",
    description: "Aucun élément ne correspond à l’affichage actuel.",
  },
  error: {
    title: "Impossible de charger les données",
    description: "Une erreur est survenue. Vous pouvez réessayer.",
  },
} as const;

export function AsyncState({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: AsyncStateProps) {
  const content = defaults[type];
  const isLoading = type === "loading";
  const Icon = type === "error" ? AlertTriangle : type === "empty" ? Inbox : RefreshCw;

  return (
    <div
      role={type === "error" ? "alert" : undefined}
      aria-live={isLoading ? "polite" : undefined}
      className={`flex min-h-[280px] w-full flex-col items-center justify-center px-6 py-10 text-center ${className}`}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/55 text-muted-foreground">
        <Icon className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
      </div>
      <h2 className="font-heading text-base font-semibold tracking-tight">
        {title ?? content.title}
      </h2>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
        {description ?? content.description}
      </p>
      {onAction && !isLoading && (
        <Button type="button" variant="outline" size="sm" className="mt-5" onClick={onAction}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          {actionLabel ?? (type === "error" ? "Réessayer" : "Actualiser")}
        </Button>
      )}
    </div>
  );
}

export function AsyncStateInline({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: AsyncStateProps) {
  return (
    <AsyncState
      type={type}
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      className={`min-h-[220px] ${className}`}
    />
  );
}

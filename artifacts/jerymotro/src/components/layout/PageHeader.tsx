import type { ReactNode } from "react";
import { useI18n } from "@/hooks/use-i18n";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, meta, actions, className = "" }: PageHeaderProps) {
  const { t } = useI18n();

  return (
    <header className={`jm-page-header ${className}`}>
      <div className="min-w-0">
        <p className="jm-page-eyebrow">
          <span aria-hidden="true" />
          {t("workspace.eyebrow")}
        </p>
        <h1 className="jm-page-title">{title}</h1>
        {description && <div className="jm-page-description">{description}</div>}
      </div>
      {(meta || actions) && (
        <div className="jm-page-header-tools">
          {meta}
          {actions}
        </div>
      )}
    </header>
  );
}

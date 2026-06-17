import { Link } from "wouter";
import { Home, Search } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="font-heading text-8xl font-bold text-primary/20 mb-6">404</div>
        <h1 className="font-heading text-2xl font-bold mb-3">{t("notfound.title")}</h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          {t("notfound.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            {t("common.back")}
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 border border-border px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-secondary transition-colors"
          >
            <Search className="w-4 h-4" />
            {t("notfound.cta")}
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Link } from "wouter";
import { Home, Search, ArrowRight } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="text-center max-w-lg">
        {/* Logo */}
        <div className="relative mb-8 flex justify-center">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <img
            src="/logo.png"
            alt="JeryMotro Logo"
            className="relative w-24 h-24 object-contain animate-bounce"
          />
        </div>

        {/* 404 Title */}
        <div className="font-heading text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary/60 mb-4">
          404
        </div>

        {/* Title and subtitle */}
        <h1 className="font-heading text-2xl font-bold mb-3">{t("notfound.title")}</h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-md mx-auto">
          {t("notfound.subtitle")}
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            href="/"
            className="group flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            <Home className="w-4 h-4" />
            {t("common.back")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 border-2 border-border bg-card px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-secondary hover:border-primary/30 transition-all"
          >
            <Search className="w-4 h-4" />
            {t("notfound.cta")}
          </Link>
        </div>

        {/* Additional info */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            JeryMotro — Surveillance des feux de brousse à Madagascar
          </p>
        </div>
      </div>
    </div>
  );
}

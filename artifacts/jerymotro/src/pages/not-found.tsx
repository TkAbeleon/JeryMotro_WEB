import { Link } from "wouter";
import { Home, Search, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/hooks/use-i18n";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <AppShell isPublic><div className="jm-notfound-page min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:p-8">
      <div className="text-center max-w-lg">
        {/* Logo */}
        <div className="relative mb-8 flex justify-center">
          <div className="absolute inset-0 bg-primary/8 rounded-full blur-3xl animate-pulse" />
          <img
            src="/logo.png"
            alt="JeryMotro Logo"
            className="jm-notfound-logo jm-logo-mark relative w-24 h-24 object-contain"
          />
        </div>

        {/* 404 Title */}
        <div className="jm-notfound-number font-heading text-7xl font-bold sm:text-8xl mb-4">
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
            className="jm-notfound-primary group flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-medium text-sm"
          >
            <Home className="w-4 h-4" />
            {t("common.back")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/dashboard"
            className="jm-notfound-secondary flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-medium text-sm"
          >
            <Search className="w-4 h-4" />
            {t("notfound.cta")}
          </Link>
        </div>

        {/* Additional info */}
        <div className="jm-notfound-footer mt-12 pt-8">
          <p className="text-xs text-muted-foreground">
            JeryMotro — Surveillance des feux de brousse à Madagascar
          </p>
        </div>
      </div>
    </div></AppShell>
  );
}

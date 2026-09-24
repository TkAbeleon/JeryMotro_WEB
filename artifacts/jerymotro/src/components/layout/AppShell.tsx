import { Sidebar, SIDEBAR_FULL, SIDEBAR_COLLAPSED } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar";
import { Sun, Moon, Languages, LogIn, Menu, X } from "lucide-react";
import { useI18n, LANG_LABELS } from "@/hooks/use-i18n";
import { useTheme } from "@/hooks/use-theme";

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile } = useSidebar();
  const marginLeft = isMobile ? 0 : isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL;
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col" style={{ marginLeft }}>
        <Topbar />
        <main className="min-h-screen flex-1 overflow-auto pt-[58px]">{children}</main>
      </div>
    </div>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const langs = ["fr", "mg", "en"] as const;
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="jm-public-nav fixed left-0 right-0 top-0 z-50 flex h-[64px] items-center justify-between px-3 sm:px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="JeryMotro — accueil">
            <span className="jm-public-logo flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
              <img src="/logo.png" alt="JeryMotro" className="jm-logo-mark h-8 w-8 object-contain" />
            </span>
            <span className="hidden truncate font-heading text-base font-bold sm:inline sm:text-lg">JeryMotro</span>
          </Link>
          <nav className="hidden items-center gap-2 lg:flex">
            <Link href="/about" className="jm-public-nav-link rounded-2xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">{t("landing.nav.about")}</Link>
            <Link href="/map" className="jm-public-nav-link rounded-2xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">{t("nav.map")}</Link>
            <Link href="/dashboard" className="jm-public-nav-link rounded-2xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">{t("nav.dashboard")}</Link>
            <Link href="/cv" className="jm-public-nav-link rounded-2xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">{lang === "mg" ? "CV Mpamorona" : lang === "en" ? "Developer CV" : "CV Développeur"}</Link>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="jm-public-lang flex h-11 items-center gap-1 rounded-2xl px-2" aria-label="Language">
            <Languages className="ml-1 mr-0.5 hidden h-3.5 w-3.5 text-muted-foreground sm:block" aria-hidden="true" />
            {langs.map((l) => (
              <button key={l} type="button" onClick={() => setLang(l)} title={LANG_LABELS[l]} aria-pressed={lang === l} className={`jm-public-lang-option min-h-8 min-w-8 rounded-xl px-1.5 text-[10px] font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${lang === l ? "jm-public-lang-active text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
            ))}
          </div>
          <button type="button" onClick={toggleTheme} aria-label="Changer de thème" className="jm-public-control flex h-11 w-11 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link href="/login" className="jm-public-login hidden min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:inline-flex">
            <LogIn className="h-4 w-4" /><span className="hidden sm:inline">{t("auth.login.title")}</span>
          </Link>
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(v => !v)}
            className="jm-public-menu-trigger flex h-11 w-11 items-center justify-center rounded-2xl lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>
      {mobileMenuOpen && (
        <div className="jm-public-mobile-menu fixed left-3 right-3 top-[72px] z-40 lg:hidden" role="dialog" aria-label="Navigation mobile">
          <nav className="grid gap-2 p-3">
            {[
              ["/about", t("landing.nav.about")],
              ["/map", t("nav.map")],
              ["/dashboard", t("nav.dashboard")],
              ["/cv", lang === "mg" ? "CV Mpamorona" : lang === "en" ? "Developer CV" : "CV Développeur"],
            ].map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="jm-public-mobile-link rounded-2xl px-4 py-3 text-sm font-medium">
                {label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="jm-public-mobile-action inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-foreground">
              <LogIn className="h-4 w-4" />{t("auth.login.title")}
            </Link>
          </nav>
        </div>
      )}
      <main className="flex-1 overflow-auto pt-[64px]">{children}</main>
    </div>
  );
}

export function AppShell({ children, isPublic }: { children: React.ReactNode; isPublic?: boolean }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isAuthenticated && !isPublic) setLocation("/login");
  }, [isAuthenticated, isPublic, setLocation]);
  if (!isAuthenticated && !isPublic) return null;
  if (!isAuthenticated && isPublic) return <PublicShell>{children}</PublicShell>;
  return <SidebarProvider><AuthenticatedShell>{children}</AuthenticatedShell></SidebarProvider>;
}
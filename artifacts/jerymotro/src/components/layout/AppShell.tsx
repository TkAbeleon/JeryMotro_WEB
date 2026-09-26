import { Sidebar, SIDEBAR_FULL, SIDEBAR_COLLAPSED } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar";
import { Sun, Moon, Languages, LogIn } from "lucide-react";
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
          <nav className="hidden items-center gap-1 lg:flex">
            <Link href="/about" className="jm-public-nav-link whitespace-nowrap rounded-xl px-2 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground xl:rounded-2xl xl:px-3 xl:text-sm">{t("landing.nav.about")}</Link>
            <Link href="/map" className="jm-public-nav-link whitespace-nowrap rounded-xl px-2 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground xl:rounded-2xl xl:px-3 xl:text-sm">{t("nav.map")}</Link>
            <Link href="/dashboard" className="jm-public-nav-link whitespace-nowrap rounded-xl px-2 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground xl:rounded-2xl xl:px-3 xl:text-sm">{t("nav.dashboard")}</Link>
            <Link href="/cv" className="jm-public-nav-link whitespace-nowrap rounded-xl px-2 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground xl:rounded-2xl xl:px-3 xl:text-sm">{lang === "mg" ? "CV Mpamorona" : lang === "en" ? "Developer CV" : "CV Développeur"}</Link>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <label htmlFor="public-language-select" className="sr-only">Langue</label>
          <select
            id="public-language-select"
            value={lang}
            onChange={(event) => setLang(event.target.value as typeof lang)}
            className="jm-public-lang h-10 max-w-12 rounded-xl px-1 text-xs font-bold uppercase text-foreground sm:hidden"
            aria-label="Langue"
          >
            {langs.map((language) => <option key={language} value={language}>{language}</option>)}
          </select>
          <div className="jm-public-lang hidden h-11 items-center gap-1 rounded-2xl px-2 sm:flex" aria-label="Language">
            <Languages className="ml-1 mr-0.5 hidden h-3.5 w-3.5 text-muted-foreground sm:block" aria-hidden="true" />
            {langs.map((l) => (
              <button key={l} type="button" onClick={() => setLang(l)} title={LANG_LABELS[l]} aria-pressed={lang === l} className={`jm-public-lang-option min-h-8 min-w-8 rounded-xl px-1.5 text-[10px] font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${lang === l ? "jm-public-lang-active text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
            ))}
          </div>
          <button type="button" onClick={toggleTheme} aria-label="Changer de thème" className="jm-public-control hidden h-11 w-11 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link href="/login" className="jm-public-login inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-xs font-semibold sm:min-h-11 sm:rounded-2xl sm:px-3.5 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <LogIn className="hidden h-4 w-4 sm:block" /><span>{t("auth.login.title")}</span>
          </Link>
          <Link href="/register" className="jm-landing-primary-button inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-xl bg-primary px-2.5 py-2 text-xs font-semibold text-primary-foreground sm:min-h-11 sm:rounded-2xl sm:px-3.5 sm:py-2.5 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            {t("auth.register.title")}
          </Link>
        </div>
      </header>
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
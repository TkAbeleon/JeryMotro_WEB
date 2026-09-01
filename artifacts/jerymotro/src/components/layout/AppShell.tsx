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
        <main className="mt-[58px] min-h-screen flex-1 overflow-auto">{children}</main>
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
      <header className="fixed left-0 right-0 top-0 z-50 flex h-[58px] items-center justify-between border-b border-border/60 bg-background/90 px-3 backdrop-blur-xl sm:px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img src="/logo.png" alt="JeryMotro" className="h-8 w-8 shrink-0 rounded-lg object-contain" />
            <span className="truncate font-heading text-base font-bold sm:text-lg">JeryMotro</span>
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            <Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">{t("landing.nav.about")}</Link>
            <Link href="/map" className="text-sm text-muted-foreground transition-colors hover:text-foreground">{t("nav.map")}</Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">{t("nav.dashboard")}</Link>
            <Link href="/cv" className="text-sm text-muted-foreground transition-colors hover:text-foreground">{lang === "mg" ? "CV Mpamorona" : lang === "en" ? "Developer CV" : "CV Développeur"}</Link>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div className="flex h-8 items-center gap-0.5 rounded-lg px-1" aria-label="Language">
            <Languages className="ml-1 mr-0.5 hidden h-3.5 w-3.5 text-muted-foreground/60 sm:block" aria-hidden="true" />
            {langs.map((l) => (
              <button key={l} type="button" onClick={() => setLang(l)} title={LANG_LABELS[l]} aria-pressed={lang === l} className={`min-h-7 min-w-7 rounded-md px-1.5 text-[9px] font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${lang === l ? "bg-muted text-foreground" : "text-muted-foreground/55 hover:bg-muted/70 hover:text-foreground"}`}>{l}</button>
            ))}
          </div>
          <button type="button" onClick={toggleTheme} aria-label="Changer de thème" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link href="/login" className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <LogIn className="h-4 w-4" /><span className="hidden sm:inline">{t("auth.login.title")}</span>
          </Link>
        </div>
      </header>
      <main className="mt-[58px] flex-1 overflow-auto">{children}</main>
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

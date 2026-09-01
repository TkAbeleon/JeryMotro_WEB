import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar";
import { Link } from "wouter";
import { Sun, Moon, Languages, LogIn } from "lucide-react";
import { useI18n, LANG_LABELS } from "@/hooks/use-i18n";
import { useTheme } from "@/hooks/use-theme";

function PublicShell({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-[58px] border-b border-border bg-background/85 backdrop-blur-md fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img src="/logo.png" alt="JeryMotro" className="h-8 w-8 shrink-0 rounded object-contain" />
            <span className="truncate font-heading font-bold text-base sm:text-lg">JeryMotro</span>
          </Link>

          <nav className="hidden items-center gap-4 md:flex">
            <Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">{t("landing.nav.about")}</Link>
            <Link href="/map" className="text-sm text-muted-foreground transition-colors hover:text-foreground">{t("nav.map")}</Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">{t("nav.dashboard")}</Link>
            <Link href="/cv" className="text-sm text-muted-foreground transition-colors hover:text-foreground">{lang === "mg" ? "CV Mpamorona" : lang === "en" ? "Developer CV" : "CV Développeur"}</Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Changer de thème"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="flex min-h-10 items-center gap-1 rounded-lg px-1">
            <Languages className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden="true" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
              aria-label="Langue"
              className="h-10 max-w-[48px] cursor-pointer bg-transparent text-xs text-muted-foreground outline-none sm:max-w-full sm:text-sm"
            >
              {Object.entries(LANG_LABELS).map(([key]) => <option key={key} value={key}>{key.toUpperCase()}</option>)}
            </select>
          </div>

          <Link
            href="/login"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">{t("auth.login.title")}</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 mt-[58px] overflow-auto">{children}</main>
    </div>
  );
}

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile } = useSidebar();
  const marginLeft = isMobile ? 0 : isCollapsed ? 76 : 248;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <main
        className="min-h-screen min-w-0 transition-[margin-left] duration-300"
        style={{ marginLeft }}
      >
        {children}
      </main>
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

  if (!isAuthenticated && isPublic) {
    return <PublicShell>{children}</PublicShell>;
  }

  return (
    <SidebarProvider>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </SidebarProvider>
  );
}

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar";
import { Sun, Moon, Languages, LogIn } from "lucide-react";
import { useI18n, LANG_LABELS } from "@/hooks/use-i18n";
import { useTheme } from "@/hooks/use-theme";

const SIDEBAR_FULL = 228;
const SIDEBAR_COLLAPSED = 64;

function Shell({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile } = useSidebar();
  const marginLeft = isMobile ? 0 : isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <div
        className="flex-1 flex flex-col min-w-0 transition-[margin-left] duration-300"
        style={{ marginLeft }}
      >
        <Topbar />
        <main className="flex-1 mt-[58px] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Guest Top Navbar */}
      <header className="h-[58px] border-b border-border bg-background/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="JeryMotro" className="h-8 rounded" />
            <span className="font-heading font-bold text-base sm:text-lg">JeryMotro</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.nav.about")}</Link>
            <Link href="/map" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.map")}</Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.dashboard")}</Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Languages className="w-4 h-4 text-muted-foreground" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
              className="bg-transparent text-xs sm:text-sm text-muted-foreground hover:text-foreground outline-none cursor-pointer max-w-[60px] sm:max-w-full"
            >
              {Object.entries(LANG_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{key.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <Link href="/login" className="text-sm bg-primary text-primary-foreground px-3 py-1.5 sm:py-2 rounded-md hover:opacity-90 transition-opacity font-medium flex items-center gap-1.5">
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">{t("auth.login.title")}</span>
          </Link>
        </div>
      </header>

      {/* Main page content - full width, padded by navbar */}
      <main className="flex-1 mt-[58px] overflow-auto">
        {children}
      </main>
    </div>
  );
}

export function AppShell({ children, isPublic }: { children: React.ReactNode; isPublic?: boolean }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated && !isPublic) {
      setLocation("/login");
    }
  }, [isAuthenticated, isPublic, setLocation]);

  if (!isAuthenticated && !isPublic) return null;

  // If visitor is browsing a public page, show the clean layout without sidebar
  if (!isAuthenticated && isPublic) {
    return <PublicShell>{children}</PublicShell>;
  }

  // If logged-in, show the full application shell
  return (
    <SidebarProvider>
      <Shell>{children}</Shell>
    </SidebarProvider>
  );
}

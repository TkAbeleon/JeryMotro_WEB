import { Search, Bell, Globe, Menu, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, LANG_LABELS, type Lang } from "@/hooks/use-i18n";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "@/hooks/use-theme";
import { SIDEBAR_FULL, SIDEBAR_COLLAPSED } from "./Sidebar";

const LANGS: Lang[] = ["fr", "mg", "en"];

export function Topbar() {
  const { user } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { toggle, isCollapsed, isMobile } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  const leftOffset = isMobile ? 0 : isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL;

  return (
    <header
      className="h-[58px] fixed top-0 right-0 border-b border-border bg-background/85 backdrop-blur-md z-10 flex items-center justify-between px-3 sm:px-4 transition-[left] duration-300"
      style={{ left: leftOffset }}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          onClick={toggle}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="hidden truncate text-sm font-semibold text-muted-foreground sm:block">{t("topbar.platform")}</span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={t("topbar.searchPlaceholder")}
            className="h-9 w-48 lg:w-60 bg-secondary border-none rounded-full pl-9 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
            aria-label={t("topbar.searchPlaceholder")}
          />
        </div>

        <div className="flex items-center gap-0.5 bg-secondary rounded-full px-1.5 py-1" aria-label="Language">
          <Globe className="w-3.5 h-3.5 text-muted-foreground ml-1 mr-0.5 hidden sm:block" />
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              title={LANG_LABELS[l]}
              aria-pressed={lang === l}
              className={`min-h-7 min-w-8 rounded-full px-1.5 text-[10px] font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${lang === l
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={t("nav.alerts")}
        >
          <Bell className="w-4 h-4" />
          <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
        </button>

        <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-3">
          <div className="hidden flex-col text-right sm:flex">
            <span className="max-w-36 truncate text-sm font-semibold leading-none">{user?.full_name || "User"}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role || "analyst"}</span>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary ring-1 ring-primary/10">
            {user?.full_name?.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}

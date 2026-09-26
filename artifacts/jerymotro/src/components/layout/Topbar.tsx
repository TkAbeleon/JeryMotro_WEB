import { Bell, Globe, Menu, Sun, Moon } from "lucide-react";
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
    <header className="fixed right-0 top-0 z-10 flex h-[58px] items-center justify-between border-b border-border/60 bg-background/90 px-3 backdrop-blur-xl transition-[left] duration-300 sm:px-5" style={{ left: leftOffset }}>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button type="button" onClick={toggle} className="jm-topbar-control flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={t("topbar.toggleSidebar")}><Menu className="h-[18px] w-[18px]" /></button>
        <span className="hidden truncate text-xs font-medium text-muted-foreground/75 sm:block">{t("topbar.platform")}</span>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <div className="jm-topbar-segment flex h-9 items-center gap-0.5 rounded-xl border border-transparent bg-muted/40 px-1" role="group" aria-label={t("topbar.language")}>
          <Globe className="ml-1 mr-0.5 hidden h-3.5 w-3.5 text-muted-foreground/60 sm:block" aria-hidden="true" />
          {LANGS.map((l) => <button key={l} type="button" onClick={() => setLang(l)} title={LANG_LABELS[l]} aria-label={LANG_LABELS[l]} aria-pressed={lang === l} className={`min-h-9 min-w-9 rounded-md px-1.5 text-[9px] font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${lang === l ? "jm-topbar-segment-active bg-background text-foreground" : "text-muted-foreground/70 hover:bg-background/70 hover:text-foreground"}`}>{l}</button>)}
        </div>

        <button type="button" onClick={toggleTheme} className="jm-topbar-control flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-muted/40 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={t("topbar.themeToggle")}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button type="button" className="jm-topbar-control relative flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-muted/40 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={t("nav.alerts")}><Bell className="h-4 w-4" /><span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive ring-2 ring-background" /></button>

        <div className="ml-1 flex items-center gap-2 border-l border-border/60 pl-2 sm:ml-2 sm:pl-3">
          <div className="hidden flex-col text-right sm:flex"><span className="max-w-36 truncate text-xs font-semibold leading-4">{user?.full_name || "User"}</span><span className="text-[10px] leading-4 text-muted-foreground">{user?.role || "analyst"}</span></div>
          <div className="jm-topbar-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/10">{user?.full_name?.charAt(0) || "U"}</div>
        </div>
      </div>
    </header>
  );
}

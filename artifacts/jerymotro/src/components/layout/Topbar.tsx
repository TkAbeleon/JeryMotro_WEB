import { Search, Bell, Globe, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, LANG_LABELS, type Lang } from "@/hooks/use-i18n";
import { useSidebar } from "@/hooks/use-sidebar";

const LANGS: Lang[] = ["fr", "mg", "en"];

const SIDEBAR_FULL = 228;
const SIDEBAR_COLLAPSED = 64;

export function Topbar() {
  const { user } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { toggle, isCollapsed, isMobile } = useSidebar();

  const leftOffset = isMobile ? 0 : isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL;

  return (
    <header
      className="h-[58px] fixed top-0 right-0 border-b border-border bg-background/80 backdrop-blur-md z-10 flex items-center justify-between px-4 transition-[left] duration-300"
      style={{ left: leftOffset }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger / toggle */}
        <button
          onClick={toggle}
          className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground transition-colors flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="text-sm font-medium text-muted-foreground hidden sm:block">{t("topbar.platform")}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search — hidden on very small screens */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("topbar.searchPlaceholder")}
            className="h-9 w-48 lg:w-56 bg-secondary border-none rounded-full pl-9 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        {/* Language switcher */}
        <div className="flex items-center gap-0.5 bg-secondary rounded-full px-2 py-1">
          <Globe className="w-3.5 h-3.5 text-muted-foreground mr-1 hidden sm:block" />
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              title={LANG_LABELS[l]}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors uppercase ${
                lang === l
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </button>

        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-border">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-medium leading-none">{user?.full_name || "User"}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role || "analyst"}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
            {user?.full_name?.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}

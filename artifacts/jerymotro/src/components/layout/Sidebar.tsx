import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard, Flame, BarChart3, Bot, MapPin, Bell, CreditCard, User, LogOut, ChevronLeft, ChevronRight, X, Map } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useSidebar } from "@/hooks/use-sidebar";
import type { TranslationKey } from "@/lib/i18n";

interface NavItem {
  labelKey: TranslationKey;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  locked?: boolean;
}

interface NavGroup {
  sectionKey: TranslationKey;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    sectionKey: "nav.section.map",
    items: [
      { labelKey: "nav.map", href: "/map", icon: Map },
    ],
  },
  {
    sectionKey: "nav.section.detections",
    items: [
      { labelKey: "nav.detections", href: "/detections", icon: Activity },
      { labelKey: "nav.clusters", href: "/clusters", icon: Flame },
    ],
  },
  {
    sectionKey: "nav.section.analyse",
    items: [
      { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
      { labelKey: "nav.predictions", href: "/predictions", icon: MapPin },
      { labelKey: "nav.stats", href: "/stats", icon: BarChart3 },
      { labelKey: "nav.chat", href: "/chat", icon: Bot, badge: "AI" },
    ],
  },
  {
    sectionKey: "nav.section.premium",
    items: [
      { labelKey: "nav.zones", href: "/zones", icon: MapPin, locked: true },
    ],
  },
  {
    sectionKey: "nav.section.account",
    items: [
      { labelKey: "nav.alerts", href: "/alerts", icon: Bell },
      { labelKey: "nav.subscriptions", href: "/subscriptions", icon: CreditCard },
      { labelKey: "nav.profile", href: "/profile", icon: User },
    ],
  },
];

const SIDEBAR_FULL = 228;
const SIDEBAR_COLLAPSED = 64;

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { t } = useI18n();
  const { isCollapsed, isOpen, isMobile, toggle, close } = useSidebar();

  const collapsed = !isMobile && isCollapsed;

  const sidebarContent = (
    <>
      {/* Header */}
      <div
        className="h-[58px] flex items-center border-b border-sidebar-border flex-shrink-0"
        style={{ paddingLeft: collapsed ? 0 : undefined, justifyContent: collapsed ? "center" : undefined }}
      >
        {collapsed ? (
          <img src="/logo.png" alt="JeryMotro" className="h-7 w-7 rounded object-cover" />
        ) : (
          <div className="flex items-center gap-3 px-4 flex-1 min-w-0">
            <img src="/logo.png" alt="JeryMotro" className="h-8 rounded flex-shrink-0" />
            <span className="font-heading font-bold text-lg text-sidebar-foreground truncate">JeryMotro</span>
          </div>
        )}
        {isMobile && (
          <button onClick={close} className="mr-3 p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <div
        className="flex-1 overflow-y-auto py-4 flex flex-col gap-4"
        style={{ paddingLeft: collapsed ? 0 : "0.75rem", paddingRight: collapsed ? 0 : "0.75rem" }}
      >
        {navGroups.map((group) => (
          <div key={group.sectionKey}>
            {!collapsed && (
              <h4 className="px-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                {t(group.sectionKey)}
              </h4>
            )}
            {collapsed && <div className="mx-auto w-6 border-t border-sidebar-border/50 mb-2" />}
            <div className="flex flex-col gap-0.5" style={{ alignItems: collapsed ? "center" : undefined }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href || (item.href === "/map" && location === "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={isMobile ? close : undefined}
                    title={collapsed ? t(item.labelKey) : undefined}
                    className={`flex items-center rounded-md transition-colors text-sm font-medium ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    } ${collapsed ? "w-10 h-10 justify-center relative" : "gap-3 px-2 py-2 w-full"}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{t(item.labelKey)}</span>
                        {item.badge && (
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && item.badge && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <div
        className="border-t border-sidebar-border flex-shrink-0"
        style={{ padding: collapsed ? "0.5rem 0" : "0.75rem", display: "flex", flexDirection: "column", alignItems: collapsed ? "center" : undefined }}
      >
        <button
          onClick={logout}
          title={collapsed ? t("common.logout") : undefined}
          className={`flex items-center rounded-md transition-colors text-sm font-medium text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground ${
            collapsed ? "w-10 h-10 justify-center" : "gap-3 px-2 py-2 w-full text-left"
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>{t("common.logout")}</span>}
        </button>
      </div>

      {/* Desktop collapse toggle */}
      {!isMobile && (
        <button
          onClick={toggle}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full border border-sidebar-border bg-sidebar flex items-center justify-center shadow-sm hover:bg-sidebar-accent transition-colors z-10 text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={close} />
        )}
        <aside
          className="fixed left-0 top-0 h-screen border-r border-sidebar-border bg-sidebar flex flex-col z-40 transition-transform duration-300"
          style={{
            width: SIDEBAR_FULL,
            transform: isOpen ? "translateX(0)" : `translateX(-${SIDEBAR_FULL}px)`,
          }}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen border-r border-sidebar-border bg-sidebar flex flex-col z-20 transition-[width] duration-300 overflow-hidden"
      style={{ width: isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL }}
    >
      {sidebarContent}
    </aside>
  );
}

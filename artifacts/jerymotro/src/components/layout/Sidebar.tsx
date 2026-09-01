import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard, Flame, BarChart3, Bot, MapPin, Bell, CreditCard, User, LogOut, ChevronLeft, ChevronRight, X, Map, BookOpen, FileText, Shield, Download, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useSidebar } from "@/hooks/use-sidebar";
import type { TranslationKey } from "@/lib/i18n";

interface NavItem { labelKey: TranslationKey; href: string; icon: React.ComponentType<{ className?: string }>; badge?: string; locked?: boolean; }
interface NavGroup { sectionKey: TranslationKey; items: NavItem[]; authOnly?: boolean; }

const navGroups: NavGroup[] = [
  { sectionKey: "nav.section.map", items: [{ labelKey: "nav.map", href: "/map", icon: Map }] },
  { sectionKey: "nav.section.surveillance", authOnly: true, items: [{ labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard }, { labelKey: "nav.detections", href: "/detections", icon: Activity }, { labelKey: "nav.clusters", href: "/clusters", icon: Flame }] },
  { sectionKey: "nav.section.analyse", authOnly: true, items: [{ labelKey: "nav.predictions", href: "/predictions", icon: MapPin }, { labelKey: "nav.stats", href: "/stats", icon: BarChart3 }, { labelKey: "nav.chat", href: "/chat", icon: Bot, badge: "AI" }] },
  { sectionKey: "nav.section.alerts", authOnly: true, items: [{ labelKey: "nav.alerts", href: "/alerts", icon: Bell }, { labelKey: "nav.zones", href: "/zones", icon: MapPin, locked: true }] },
  { sectionKey: "nav.section.account", authOnly: true, items: [{ labelKey: "nav.profile", href: "/profile", icon: User }, { labelKey: "nav.subscriptions", href: "/subscriptions", icon: CreditCard }, { labelKey: "nav.export", href: "/export", icon: Download }] },
  { sectionKey: "nav.section.resources", items: [{ labelKey: "nav.about", href: "/about", icon: BookOpen }, { labelKey: "nav.cv", href: "/cv", icon: FileText }, { labelKey: "nav.legal", href: "/legal", icon: FileText }, { labelKey: "nav.privacy", href: "/privacy", icon: Shield }] },
];

const SIDEBAR_FULL = 248;
const SIDEBAR_COLLAPSED = 76;
export { SIDEBAR_FULL, SIDEBAR_COLLAPSED };

export function Sidebar() {
  const [location] = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const { isCollapsed, isOpen, isMobile, toggle, close } = useSidebar();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const collapsed = !isMobile && isCollapsed;

  useEffect(() => {
    if (!isMobile || !isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [isMobile, isOpen, close]);

  const isActive = (href: string) => location === href;
  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-3 sm:h-[68px]">
        {collapsed ? <button type="button" onClick={toggle} aria-label={t("common.open")} className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-primary"><img src="/logo.png" alt="JeryMotro" className="h-8 w-8 rounded-lg object-cover" /></button> : <div className="flex min-w-0 flex-1 items-center gap-3 px-2"><img src="/logo.png" alt="JeryMotro" className="h-9 w-9 shrink-0 rounded-xl object-cover" /><div className="min-w-0"><div className="truncate font-heading text-[15px] font-bold tracking-tight">JeryMotro</div><div className="truncate text-[11px] font-medium text-sidebar-foreground/45">Fire intelligence</div></div></div>}
        {isMobile && <button ref={closeButtonRef} type="button" onClick={close} aria-label={t("common.close")} className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sidebar-foreground/65 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-primary"><X className="h-5 w-5" /></button>}
      </div>
      <nav aria-label="Application navigation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3 sm:px-3 sm:py-4" style={{ scrollbarGutter: "stable", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <div className={collapsed ? "space-y-3" : "space-y-4"}>
          {navGroups.filter((group) => !group.authOnly || isAuthenticated).map((group, groupIndex) => <section key={group.sectionKey} aria-label={collapsed ? undefined : t(group.sectionKey)}>{!collapsed ? <h2 className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/40">{t(group.sectionKey)}</h2> : groupIndex > 0 && <div className="mx-auto mb-2 h-px w-8 bg-sidebar-border/70" />}<div className="space-y-0.5">{group.items.map((item) => { const Icon = item.icon; const active = isActive(item.href); return <Link key={item.href} href={item.href} onClick={isMobile ? close : undefined} title={collapsed ? t(item.labelKey) : undefined} aria-current={active ? "page" : undefined} className={`group relative flex min-h-11 items-center rounded-xl text-[13px] font-semibold outline-none transition-[background-color,color,transform] duration-150 hover:translate-x-px focus-visible:ring-2 focus-visible:ring-primary ${active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"} ${collapsed ? "mx-auto w-11 justify-center" : "w-full gap-3 px-3"}`}>{active && !collapsed && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary-foreground/85" />}<Icon className="h-[18px] w-[18px] shrink-0" />{!collapsed && <><span className="min-w-0 flex-1 truncate text-left">{t(item.labelKey)}</span>{item.locked && <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-primary">PRO</span>}{item.badge && <span className="inline-flex items-center gap-1 rounded-md bg-primary/12 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-primary"><Sparkles className="h-2.5 w-2.5" />{item.badge}</span>}</>}{collapsed && item.badge && <span aria-hidden className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-sidebar" />}</Link>; })}</div></section>)}
        </div>
      </nav>
      <div className={`shrink-0 border-t border-sidebar-border ${collapsed ? "px-2 py-2" : "p-3"}`} style={{ paddingBottom: collapsed ? "max(0.5rem, env(safe-area-inset-bottom))" : "max(0.75rem, env(safe-area-inset-bottom))" }}>
        {isAuthenticated && <button type="button" onClick={logout} title={collapsed ? t("common.logout") : undefined} className={`flex min-h-11 items-center rounded-xl text-[13px] font-semibold text-sidebar-foreground/70 outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-primary ${collapsed ? "mx-auto w-11 justify-center" : "w-full gap-3 px-3"}`}><LogOut className="h-[18px] w-[18px] shrink-0" />{!collapsed && <span>{t("common.logout")}</span>}</button>}
      </div>
      {!isMobile && <button type="button" onClick={toggle} aria-label={isCollapsed ? t("common.open") : t("common.close")} className="absolute -right-3 top-[77px] z-20 flex h-7 w-7 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/55 shadow-sm outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-primary">{isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}</button>}
    </div>
  );
  if (isMobile) return <><div className={`fixed inset-0 z-30 bg-black/55 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden onClick={close} /><aside aria-label="Application navigation" aria-hidden={!isOpen} className={`fixed left-0 top-0 z-40 h-[100dvh] w-[min(86vw,340px)] border-r border-sidebar-border shadow-2xl transition-transform duration-300 ease-out lg:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>{sidebarContent}</aside></>;
  return <aside aria-label="Application navigation" className="fixed left-0 top-0 z-20 hidden h-[100dvh] flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out lg:flex" style={{ width: isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL }}>{sidebarContent}</aside>;
}

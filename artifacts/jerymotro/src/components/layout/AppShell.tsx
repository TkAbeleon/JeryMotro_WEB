import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar";

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

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <Shell>{children}</Shell>
    </SidebarProvider>
  );
}

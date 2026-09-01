import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar";

function PublicShell({ children }: { children: React.ReactNode }) {
  const { useI18n, useTheme } = {} as any;
  return <div className="min-h-screen bg-background text-foreground flex flex-col">{children}</div>;
}

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile } = useSidebar();
  const marginLeft = isMobile ? 0 : isCollapsed ? 76 : 248;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="min-h-screen min-w-0 transition-[margin-left] duration-300" style={{ marginLeft }}>
        <Topbar />
        <main className="min-h-screen overflow-auto pt-[58px]">
          {children}
        </main>
      </div>
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

  return (
    <SidebarProvider>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </SidebarProvider>
  );
}

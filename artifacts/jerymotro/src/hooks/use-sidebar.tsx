import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface SidebarContextType {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  toggle: () => void;
  collapse: () => void;
  open: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

const COLLAPSED_KEY = "jerymotro_sidebar_collapsed";

function getIsMobile() {
  return typeof window !== "undefined" && window.innerWidth < 1024;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(getIsMobile);
  // Desktop: collapsed = icon-only. Mobile: isOpen = whether overlay is visible
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === "true"; } catch { return false; }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      const mobile = getIsMobile();
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false); // close overlay when going to desktop
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const toggle = useCallback(() => {
    if (isMobile) {
      setIsOpen(v => !v);
    } else {
      setIsCollapsed(v => {
        const next = !v;
        try { localStorage.setItem(COLLAPSED_KEY, String(next)); } catch {}
        return next;
      });
    }
  }, [isMobile]);

  const collapse = useCallback(() => {
    if (isMobile) setIsOpen(false);
    else {
      setIsCollapsed(true);
      try { localStorage.setItem(COLLAPSED_KEY, "true"); } catch {}
    }
  }, [isMobile]);

  const open = useCallback(() => {
    if (isMobile) setIsOpen(true);
    else {
      setIsCollapsed(false);
      try { localStorage.setItem(COLLAPSED_KEY, "false"); } catch {}
    }
  }, [isMobile]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, isCollapsed, isMobile, toggle, collapse, open, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be inside SidebarProvider");
  return ctx;
}

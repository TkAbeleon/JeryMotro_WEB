import { Switch, Route, Router as WouterRouter, Redirect, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider, useTheme } from "@/hooks/use-theme";
import { I18nProvider, useI18n } from "@/hooks/use-i18n";
import { AppShell } from "@/components/layout/AppShell";
import { SeoHead } from "@/components/seo/SeoHead";
import LoadingPage from "@/components/ui/loading";
import { useState, useEffect, lazy, Suspense } from "react";

import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import NotFound from "@/pages/not-found";
import LegalPage from "@/pages/legal";
import PrivacyPage from "@/pages/privacy";
import AboutPage from "@/pages/about";
import CvPage from "@/pages/cv";
// Leaflet is kept lazy so the SSR server never evaluates browser-only map modules.
const MapPage = lazy(() => import("@/pages/map-redesign"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const DetectionsPage = lazy(() => import("@/pages/detections"));
const ClustersPage = lazy(() => import("@/pages/clusters"));
const PredictionsPage = lazy(() => import("@/pages/predictions"));
const StatsPage = lazy(() => import("@/pages/stats"));
const ChatPage = lazy(() => import("@/pages/chat"));
const ZonesPage = lazy(() => import("@/pages/zones"));
const AlertsPage = lazy(() => import("@/pages/alerts"));
const SubscriptionsPage = lazy(() => import("@/pages/subscriptions"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const ExportPage = lazy(() => import("@/pages/export"));

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://") || envUrl.startsWith("/"))) return envUrl;
  const apiPort = import.meta.env.VITE_API_BACKEND_PORT || "8081";
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname || "localhost"}:${apiPort}`;
  }
  return `http://localhost:${apiPort}`;
};

setBaseUrl(getApiUrl());
setAuthTokenGetter(() => typeof localStorage !== "undefined" ? localStorage.getItem("jerymotro_token") : null);

const BACKGROUND_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        if ((error as { status?: number })?.status === 401) {
          localStorage.removeItem("jerymotro_token");
          localStorage.removeItem("jerymotro_user");
          window.location.href = "/";
          return false;
        }
        return failureCount < 1;
      },
      staleTime: 30000,
      refetchInterval: BACKGROUND_REFRESH_INTERVAL_MS,
      refetchIntervalInBackground: true,
    },
    mutations: {
      onError: (error: unknown) => {
        if ((error as { status?: number })?.status === 401) {
          localStorage.removeItem("jerymotro_token");
          localStorage.removeItem("jerymotro_user");
          window.location.href = "/";
        }
      },
    },
  },
});

function AuthedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useI18n();
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);
  if (!isAuthenticated) return <Redirect to="/" />;
  if (isLoading) return <LoadingPage message={t("common.loading")} />;
  return <AppShell><Suspense fallback={<LoadingPage message={t("common.loading")} />}><Component /></Suspense></AppShell>;
}

function PublicShell({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  return <div className="min-h-screen bg-background text-foreground flex flex-col">
    <header className="h-[58px] border-b border-border bg-background/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-6"><Link href="/" className="flex items-center gap-3"><img src="/logo.png" alt="JeryMotro" className="h-8 rounded" /><span className="font-heading font-bold text-base sm:text-lg">JeryMotro</span></Link>
        <nav className="hidden md:flex items-center gap-4"><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">{t("landing.nav.about")}</Link><Link href="/map" className="text-sm text-muted-foreground hover:text-foreground">{t("nav.map")}</Link><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">{t("nav.dashboard")}</Link><Link href="/cv" className="text-sm text-muted-foreground hover:text-foreground">{lang === "mg" ? "CV Mpamorona" : lang === "en" ? "Developer CV" : "CV Développeur"}</Link></nav>
      </div>
      <div className="flex items-center gap-2 sm:gap-4"><button onClick={toggleTheme} className="p-2 rounded-md hover:bg-secondary" aria-label="Toggle theme">{theme === "dark" ? "☀" : "☾"}</button><select value={lang} onChange={(e) => setLang(e.target.value as any)} className="bg-transparent text-xs outline-none"><option value="fr">FR</option><option value="mg">MG</option><option value="en">EN</option></select><Link href="/login" className="text-sm bg-primary text-primary-foreground px-3 py-2 rounded-md font-medium">{t("auth.login.title")}</Link></div>
    </header><main className="flex-1 mt-[58px] overflow-auto">{children}</main>
  </div>;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { t } = useI18n();
  return <PublicShell><Suspense fallback={<LoadingPage message={t("common.loading")} />}><Component /></Suspense></PublicShell>;
}

function HomeRedirect() { const { isAuthenticated } = useAuth(); return isAuthenticated ? <Redirect to="/map" /> : <LandingPage />; }

function Router() {
  return <><SeoHead /><Switch>
    <Route path="/" component={HomeRedirect} /><Route path="/login" component={LoginPage} /><Route path="/register" component={RegisterPage} />
    <Route path="/map">{() => <AuthedRoute component={MapPage} />}</Route>
    <Route path="/dashboard">{() => <PublicRoute component={DashboardPage} />}</Route>
    <Route path="/legal">{() => <PublicRoute component={LegalPage} />}</Route><Route path="/privacy">{() => <PublicRoute component={PrivacyPage} />}</Route><Route path="/about">{() => <PublicRoute component={AboutPage} />}</Route><Route path="/cv">{() => <PublicRoute component={CvPage} />}</Route>
    <Route path="/detections">{() => <AuthedRoute component={DetectionsPage} />}</Route><Route path="/clusters">{() => <AuthedRoute component={ClustersPage} />}</Route><Route path="/predictions">{() => <AuthedRoute component={PredictionsPage} />}</Route><Route path="/stats">{() => <AuthedRoute component={StatsPage} />}</Route><Route path="/chat">{() => <AuthedRoute component={ChatPage} />}</Route><Route path="/zones">{() => <AuthedRoute component={ZonesPage} />}</Route><Route path="/alerts">{() => <AuthedRoute component={AlertsPage} />}</Route><Route path="/subscriptions">{() => <AuthedRoute component={SubscriptionsPage} />}</Route><Route path="/profile">{() => <AuthedRoute component={ProfilePage} />}</Route><Route path="/export">{() => <AuthedRoute component={ExportPage} />}</Route>
    <Route component={NotFound} />
  </Switch></>;
}

function App({ initialLang }: { initialLang?: "fr" | "mg" | "en" }) {
  const getWouterBase = () => { const base = import.meta.env.BASE_URL.replace(/\/$/, ""); const path = typeof window !== "undefined" ? window.location.pathname : "/"; const match = path.match(/^\/(fr|mg|en)\b/); return match ? `${base}/${match[1]}` : base; };
  return <QueryClientProvider client={queryClient}><ThemeProvider><I18nProvider initialLang={initialLang}><AuthProvider><TooltipProvider><WouterRouter base={getWouterBase()}><Router /></WouterRouter><Toaster /></TooltipProvider></AuthProvider></I18nProvider></ThemeProvider></QueryClientProvider>;
}

export default App;

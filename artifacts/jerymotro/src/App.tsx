import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
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
// MapPage and DashboardPage are lazy to prevent Leaflet (which reads navigator.userAgent
// at ESM module-load time) from being bundled into the SSR server build and crashing Node.
const MapPage = lazy(() => import("@/pages/map"));
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
  if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://") || envUrl.startsWith("/"))) {
    return envUrl;
  }
  const apiPort = import.meta.env.VITE_API_BACKEND_PORT || "8081";
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const host = hostname || "localhost";
    return `${protocol}//${host}:${apiPort}`;
  }
  return `http://localhost:${apiPort}`;
};

// Wire auth token and backend URL to every API call
setBaseUrl(getApiUrl());
setAuthTokenGetter(() => typeof localStorage !== "undefined" ? localStorage.getItem("jerymotro_token") : null);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Never retry 401 (invalid/expired token) and redirect
        if ((error as { status?: number })?.status === 401) {
          localStorage.removeItem("jerymotro_token");
          localStorage.removeItem("jerymotro_user");
          window.location.href = "/";
          return false;
        }
        return failureCount < 1;
      },
      staleTime: 30000,
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
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Redirect to="/" />;

  if (isLoading) {
    return <LoadingPage message={t("common.loading")} />;
  }

  return (
    <AppShell>
      <Suspense fallback={<LoadingPage message={t("common.loading")} />}>
        <Component />
      </Suspense>
    </AppShell>
  );
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { t } = useI18n();

  return (
    <AppShell isPublic>
      <Suspense fallback={<LoadingPage message={t("common.loading")} />}>
        <Component />
      </Suspense>
    </AppShell>
  );
}

function HomeRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Redirect to="/map" /> : <LandingPage />;
}

function Router() {
  return (
    <>
      <SeoHead />
      <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/map">
        {() => <PublicRoute component={MapPage} />}
      </Route>
      <Route path="/dashboard">
        {() => <PublicRoute component={DashboardPage} />}
      </Route>
      <Route path="/legal">
        {() => <PublicRoute component={LegalPage} />}
      </Route>
      <Route path="/privacy">
        {() => <PublicRoute component={PrivacyPage} />}
      </Route>
      <Route path="/about">
        {() => <PublicRoute component={AboutPage} />}
      </Route>
      <Route path="/cv">
        {() => <PublicRoute component={CvPage} />}
      </Route>
      <Route path="/detections">
        {() => <AuthedRoute component={DetectionsPage} />}
      </Route>
      <Route path="/clusters">
        {() => <AuthedRoute component={ClustersPage} />}
      </Route>
      <Route path="/predictions">
        {() => <AuthedRoute component={PredictionsPage} />}
      </Route>
      <Route path="/stats">
        {() => <AuthedRoute component={StatsPage} />}
      </Route>
      <Route path="/chat">
        {() => <AuthedRoute component={ChatPage} />}
      </Route>
      <Route path="/zones">
        {() => <AuthedRoute component={ZonesPage} />}
      </Route>
      <Route path="/alerts">
        {() => <AuthedRoute component={AlertsPage} />}
      </Route>
      <Route path="/subscriptions">
        {() => <AuthedRoute component={SubscriptionsPage} />}
      </Route>
      <Route path="/profile">
        {() => <AuthedRoute component={ProfilePage} />}
      </Route>
      <Route path="/export">
        {() => <AuthedRoute component={ExportPage} />}
      </Route>
      <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App({ initialLang }: { initialLang?: "fr" | "mg" | "en" }) {
  const getWouterBase = () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const path = typeof window !== "undefined" ? window.location.pathname : "/";
    const match = path.match(/^\/(fr|mg|en)\b/);
    return match ? `${base}/${match[1]}` : base;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider initialLang={initialLang}>
          <AuthProvider>
            <TooltipProvider>
              <WouterRouter base={getWouterBase()}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

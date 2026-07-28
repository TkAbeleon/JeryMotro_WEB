import { HelmetProvider } from 'react-helmet-async';
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { I18nProvider } from "@/hooks/use-i18n";
import { AppShell } from "@/components/layout/AppShell";
import { SeoHead } from "@/components/seo/SeoHead";
import LoadingPage from "@/components/ui/loading";
import { useState, useEffect } from "react";

import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import MapPage from "@/pages/map";
import DashboardPage from "@/pages/dashboard";
import DetectionsPage from "@/pages/detections";
import ClustersPage from "@/pages/clusters";
import PredictionsPage from "@/pages/predictions";
import StatsPage from "@/pages/stats";
import ChatPage from "@/pages/chat";
import ZonesPage from "@/pages/zones";
import AlertsPage from "@/pages/alerts";
import SubscriptionsPage from "@/pages/subscriptions";
import ProfilePage from "@/pages/profile";
import ExportPage from "@/pages/export";
import NotFound from "@/pages/not-found";

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://") || envUrl.startsWith("/"))) {
    return envUrl;
  }
  const apiPort = import.meta.env.VITE_API_BACKEND_PORT || "8081";
  const { protocol, hostname } = window.location;
  const host = hostname || "localhost";
  return `${protocol}//${host}:${apiPort}`;
};

// Wire auth token and backend URL to every API call
setBaseUrl(getApiUrl());
setAuthTokenGetter(() => localStorage.getItem("jerymotro_token"));

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
  if (!isAuthenticated) return <Redirect to="/" />;
  return (
    <AppShell>
      <Component />
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
        {() => <AuthedRoute component={MapPage} />}
      </Route>
      <Route path="/dashboard">
        {() => <AuthedRoute component={DashboardPage} />}
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

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {isLoading ? (
          <LoadingPage message="Chargement de JeryMotro..." />
        ) : (
          <I18nProvider>
            <AuthProvider>
              <TooltipProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </AuthProvider>
          </I18nProvider>
        )}
      </ThemeProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;

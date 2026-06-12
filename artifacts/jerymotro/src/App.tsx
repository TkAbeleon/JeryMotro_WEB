import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { I18nProvider } from "@/hooks/use-i18n";
import { AppShell } from "@/components/layout/AppShell";

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
import NotFound from "@/pages/not-found";

// Wire auth token to every API call — reads from localStorage on each request
setAuthTokenGetter(() => localStorage.getItem("jerymotro_token"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function AuthedRoute({ component: Component }: { component: React.ComponentType }) {
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

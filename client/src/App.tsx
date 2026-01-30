import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Kanban from "./pages/Kanban";
import ListaPrazo from "./pages/ListaPrazo";
import Exportar from "./pages/Exportar";
import Login from "./pages/Login";
import Bloqueadores from "./pages/Bloqueadores";
import { useAuth } from "react-oidc-context"; //
import { useEffect } from "react";

function Router() {
  const auth = useAuth(); //
  const [location, setLocation] = useLocation();

  // Monitora o estado de autenticação para proteger as rotas
  useEffect(() => {
  const hasCode = new URLSearchParams(window.location.search).has("code");

  if (!auth.isLoading && !auth.isAuthenticated && location !== "/login" && !hasCode) {
    setLocation("/login");
  }
}, [auth.isAuthenticated, auth.isLoading, location, setLocation]);

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary font-medium">Sincronizando Jarvis...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />

      {/* Rotas Protegidas - Só acessíveis se auth.isAuthenticated for true */}
      {auth.isAuthenticated ? (
        <Route path="*">
          <DashboardLayout>
            <Switch>
              <Route path="/" component={Kanban} />
              <Route path="/lista-prazo" component={ListaPrazo} />
              <Route path="/exportar" component={Exportar} />
              <Route path="/bloqueadores" component={Bloqueadores} />
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        </Route>
      ) : (
        /* Enquanto redireciona ou se falhar, mantém no login */
        <Route path="*" component={Login} />
      )}
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
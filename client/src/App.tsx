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
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function Router() {
  const auth = useAuth();
  const [location, setLocation] = useLocation();

  // Depuração de estado no Console
  console.log("Jarvis Auth State:", {
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    hasError: !!auth.error
  });

  useEffect(() => {
    const hasCode = new URLSearchParams(window.location.search).has("code");

    // 1. Se estiver logado e ainda estiver na página de login, VÁ PARA O DASHBOARD
    if (auth.isAuthenticated && location === "/login") {
        console.log("🚀 Autenticado! Movendo para o Dashboard...");
        setLocation("/");
        return;
    }

    // SÓ redireciona se não estiver carregando, não estiver logado, não estiver no login e NÃO houver código na URL
    if (!auth.isLoading && !auth.isAuthenticated && location !== "/login" && !hasCode) {
      console.warn("🔒 Acesso negado: Redirecionando para login.");
      setLocation("/login");
    }
  }, [auth.isAuthenticated, auth.isLoading, location, setLocation]);

  // TELA DE ERRO ROBUSTA
  if (auth.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-destructive/10 p-6 text-center">
        <h2 className="text-2xl font-bold text-destructive">Falha na Autenticação</h2>
        <p className="mt-2 text-muted-foreground">O Jarvis não conseguiu validar suas credenciais.</p>
        <div className="mt-4 p-4 bg-background border rounded-md text-xs font-mono text-left overflow-auto max-w-lg">
          {auth.error.message}
        </div>
        <Button className="mt-6" onClick={() => window.location.href = "/login"}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (auth.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        <p className="mt-4 animate-pulse">Sincronizando com Jarvis...</p>
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
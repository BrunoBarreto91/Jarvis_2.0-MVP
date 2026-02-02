import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Kanban from "./pages/Kanban";
import ListaPrazo from "./pages/ListaPrazo";
import Exportar from "./pages/Exportar";
import Login from "./pages/Login";
import Bloqueadores from "./pages/Bloqueadores";
import { useAuth } from "react-oidc-context";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function Router() {
  const auth = useAuth();

  // 1. Estado de carregamento: evita o loop de redirecionamento
  if (auth.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        <p className="mt-4 animate-pulse text-muted-foreground">Sincronizando com Jarvis...</p>
      </div>
    );
  }

  // 2. Tratamento de erro robusto
  if (auth.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-destructive/5">
        <h2 className="text-2xl font-bold text-destructive">Erro de Acesso</h2>
        <p className="mt-2 text-muted-foreground max-w-md">{auth.error.message}</p>
        <Button className="mt-6" onClick={() => auth.signinRedirect()}>Tentar Novamente</Button>
      </div>
    );
  }

  // 3. Se NÃO estiver autenticado, renderiza a tela de Login
  if (!auth.isAuthenticated) {
    return <Login />;
  }

  // 4. Se autenticado, renderiza as rotas dentro do DashboardLayout
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Kanban} />
        <Route path="/lista-prazo" component={ListaPrazo} />
        <Route path="/bloqueadores" component={Bloqueadores} />
        <Route path="/exportar" component={Exportar} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
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

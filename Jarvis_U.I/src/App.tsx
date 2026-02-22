import { Route, Switch } from "wouter";
import { AuthProvider } from "@/_core/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ZenMode from "@/pages/ZenMode";
import TasksPage from "@/pages/TasksPage";
import KanbanPage from "@/pages/KanbanPage";
import BlockersPage from "@/pages/BlockersPage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import VerifyPage from "@/pages/VerifyPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function App() {
  return (
    <AuthProvider>
      <Switch>
        {/* ── Public routes – rendered WITHOUT dashboard shell ── */}
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignUpPage} />
        <Route path="/verify" component={VerifyPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />

        {/* ── Protected routes – require authenticated session ── */}
        <Route>
          <ProtectedRoute>
            <DashboardLayout>
              <ErrorBoundary>
                <Switch>
                  <Route path="/" component={ZenMode} />
                  <Route path="/tasks" component={TasksPage} />
                  <Route path="/kanban" component={KanbanPage} />
                  <Route path="/blockers" component={BlockersPage} />
                  <Route path="/settings" component={SettingsPage} />
                  <Route>404: Página não encontrada</Route>
                </Switch>
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        </Route>
      </Switch>

      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;

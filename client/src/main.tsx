import _ from 'lodash';
import React, { StrictMode } from 'react';
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from "react-oidc-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from '@trpc/client';
import { trpc } from "./lib/trpc";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./index.css";

if (typeof window !== 'undefined') {
  (window as any)._ = _;
}

const cognitoConfig = {
  authority: import.meta.env.VITE_COGNITO_AUTHORITY,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
  response_type: "code",
  scope: "phone openid email",
};

const onSigninCallback = (_user: any): void => {
  console.log("✅ Sucesso: Usuário carregado via Cognito.");
  window.history.replaceState({}, document.title, window.location.pathname);
};

const onSigninError = (error: any): void => {
  console.error("❌ Erro Crítico no Login Cognito:", error.message);
  console.error("Detalhes do Erro:", error);
};

const queryClient = new QueryClient();

// Componente Wrapper para injetar o cliente tRPC com o token do OIDC
function TRPCProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  
  const trpcClient = React.useMemo(() => {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
    
    return trpc.createClient({
      links: [
        httpBatchLink({
          url: baseUrl,
          fetch(url, options) {
            let targetUrl = url.toString();
            
            // Mapeamento de rotas tRPC -> API Gateway REST
            // O tRPC concatena o nome do procedimento na URL
            if (targetUrl.includes('tasks.list')) {
                targetUrl = targetUrl.replace('tasks.list', 'tasks');
            } else if (targetUrl.includes('tasks.create')) {
                targetUrl = targetUrl.replace('tasks.create', 'tasks');
            } else if (targetUrl.includes('tasks.update')) {
                targetUrl = targetUrl.replace('tasks.update', 'tasks');
            }
            
            const headers = {
              ...options.headers,
            } as Record<string, string>;

            // Injeta o token JWT se o usuário estiver autenticado
            if (auth.user?.id_token) {
              headers["Authorization"] = auth.user.id_token;
            }

            return fetch(targetUrl, {
              ...options,
              headers,
              credentials: 'include',
            });
          },
        })
      ]
    });
  }, [auth.user?.id_token]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider
      {...cognitoConfig}
      onSigninCallback={onSigninCallback}
      onSigninError={onSigninError}
    >
      <TRPCProvider>
        <App />
        <Toaster />
      </TRPCProvider>
    </AuthProvider>
  </StrictMode>
);

import _ from 'lodash';
import React, { StrictMode } from 'react';
import { createRoot } from "react-dom/client";
import { AuthProvider } from "react-oidc-context";
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

// Função para garantir que a URL da API esteja correta
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_BASE_URL || "";
  
  // Se a URL não termina com /api/trpc, mas termina com o domínio, adicionamos o prefixo
  if (url && !url.includes("/api/trpc")) {
    // Remove barra final se existir
    url = url.replace(/\/$/, "");
    url = `${url}/api/trpc`;
  }
  
  return url;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider
      {...cognitoConfig}
      onSigninCallback={onSigninCallback}
      onSigninError={onSigninError}
    >
      <trpc.Provider
        client={trpc.createClient({
          links: [
            httpBatchLink({
              url: getBaseUrl(),
              // Força o envio de cookies em requisições cross-origin
              fetch(url, options) {
                return fetch(url, {
                  ...options,
                  credentials: 'include',
                });
              },
            })
          ]
        })}
        queryClient={queryClient}
      >
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster />
        </QueryClientProvider>
      </trpc.Provider>
    </AuthProvider>
  </StrictMode>
);

import _ from 'lodash';
import React, { StrictMode } from 'react';
import { createRoot } from "react-dom/client";
import { AuthProvider } from "react-oidc-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from '@trpc/client'; // Import necessário para o link
import { trpc } from "./lib/trpc";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./index.css";

if (typeof window !== 'undefined') {
  (window as any)._ = _;
}

// Configuração extraída do print da AWS
const cognitoConfig = {
  authority: import.meta.env.VITE_COGNITO_AUTHORITY,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
  response_type: "code",
  scope: "phone openid email",
};

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider {...cognitoConfig}>
      {/* Corrigido: Agora o tRPC aponta corretamente para a API da AWS */}
      <trpc.Provider
        client={trpc.createClient({
          links: [
            httpBatchLink({
              url: import.meta.env.VITE_API_BASE_URL
            })
          ],
        })}
        queryClient={queryClient}
      >
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster />
        </QueryClientProvider>
      </trpc.Provider>
    </AuthProvider>
  </StrictMode>,
);
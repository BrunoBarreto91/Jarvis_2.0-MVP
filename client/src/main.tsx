import * as _ from 'lodash-es';
(window as any)._ = _;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Mudamos para o Sonner, que existe na sua pasta ui/
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./index.css";

// Criamos o cliente aqui mesmo para não depender de arquivo faltando no /lib
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
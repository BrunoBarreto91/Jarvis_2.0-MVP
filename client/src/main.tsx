import _ from 'lodash';
(window as any)._ = _;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Alterado para o Sonner, que existe na pasta ui/
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./index.css";
// Adicionado o import para solucionar o erro "_.forEach"
import _ from 'lodash';
if (typeof window !== 'undefined') {
  (window as any)._ = _;
}
// Criado o cliente aqui mesmo para nÃ£o depender de arquivo faltando no /lib
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);

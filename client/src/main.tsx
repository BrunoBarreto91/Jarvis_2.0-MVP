import _ from 'lodash';
if (typeof window !== 'undefined') {
  (window as any)._ = _;
}

import React, { StrictMode } from 'react';
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./lib/trpc";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <trpc.Provider client={trpc.createClient({ links: [] })} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
);
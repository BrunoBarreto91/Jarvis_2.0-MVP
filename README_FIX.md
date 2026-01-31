# Correções de Autenticação e Comunicação - Jarvis 2.0 MVP

## Problemas Resolvidos

### 1. Renderização de Tela Branca após Login
- **Causa:** O `App.tsx` continha um código de teste que bloqueava as rotas reais, e o `useAuth` dependia de dados inexistentes no `localStorage`.
- **Solução:** O hook `useAuth` foi refatorado para usar o estado do `react-oidc-context`. O roteamento no `App.tsx` agora renderiza corretamente os componentes após a confirmação da autenticação.

### 2. Erro "Failed to fetch" (tRPC 404)
- **Causa:** A URL da API configurada no cliente estava incompleta (faltando o prefixo `/api/trpc`) e as requisições não enviavam cookies de sessão para o domínio da AWS.
- **Solução:** 
  - Implementada a função `getBaseUrl()` no `main.tsx` para garantir que a URL sempre contenha o sufixo `/api/trpc`.
  - Configurado `credentials: 'include'` no cliente tRPC para permitir o envio do cookie `app_session_id` em chamadas cross-origin.

### 3. Resiliência do Kanban
- **Solução:** Adicionado tratamento de erro visual no componente `Kanban.tsx` com botão de "Tentar Novamente", evitando que falhas de rede travem a interface do usuário.

## Como Validar
1. Acesse [https://jarvis-2-0-mvp-ardl.vercel.app/](https://jarvis-2-0-mvp-ardl.vercel.app/).
2. Realize o login via Cognito.
3. O sistema deve carregar o Kanban automaticamente.
4. No DevTools (Network), verifique se as chamadas tRPC estão indo para `.../api/trpc/tasks.list` com status `200`.

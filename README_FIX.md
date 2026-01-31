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

## Atualização: Correção de CORS e Debug de Roteamento

### Problema Identificado
O erro 404 persistia mesmo com a URL correta. Isso sugere que:
1.  **CORS:** O servidor na AWS não estava configurado para aceitar requisições do domínio do Vercel com credenciais (cookies).
2.  **Visibilidade:** Não havia logs no servidor para confirmar se a requisição estava chegando ao Express.

### Correções Implementadas
1.  **Middleware de CORS:** Adicionado o pacote `cors` ao servidor Express, configurado especificamente para permitir `https://jarvis-2-0-mvp-ardl.vercel.app` com `credentials: true`.
2.  **Logs de Debug:** Adicionado um middleware de log no servidor para registrar todas as requisições recebidas (`[DEBUG] METHOD URL`). Isso ajudará a identificar se o API Gateway está removendo prefixos ou alterando o caminho.
3.  **Estabilização do Cliente:** Refinada a lógica de `getBaseUrl` no cliente para evitar duplicidade de caminhos.

### Como Validar
1. Verifique se as requisições `OPTIONS` (preflight) agora retornam `204` ou `200` com os cabeçalhos CORS corretos.
2. Verifique os logs do CloudWatch para ver as entradas `[DEBUG]`.

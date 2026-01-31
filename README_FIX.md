# Correções de Autenticação e Renderização - Jarvis 2.0 MVP

## Problemas Identificados
1.  **Fantasmas do LocalStorage:** O hook `useAuth` original dependia exclusivamente de chaves no `localStorage` (`jarvis_user`, `jarvis_access_token`), que não eram preenchidas pelo fluxo `react-oidc-context`.
2.  **Redirecionamento Infinito/Bloqueio:** O `DashboardLayout` tentava redirecionar para `/login` se o `user` (do `localStorage`) estivesse vazio, ignorando o estado real de autenticação do OIDC.
3.  **Código de Teste no App.tsx:** O arquivo `App.tsx` continha um retorno antecipado de "Autenticação Confirmada!", o que impedia a renderização das rotas reais (`Kanban`, etc.) após o login.

## Correções Implementadas
1.  **Novo Hook `useAuth`:** Agora o hook utiliza o estado do `react-oidc-context` para determinar se o usuário está autenticado e extrai os dados do perfil diretamente do token ID da AWS Cognito.
2.  **Roteamento Corrigido no `App.tsx`:** Removido o código de teste. Agora, se `auth.isAuthenticated` for verdadeiro, ele renderiza o `DashboardLayout` com o `Switch` de rotas.
3.  **Limpeza no `DashboardLayout`:** Removida a lógica de redirecionamento manual que conflitava com o OIDC. Agora ele apenas consome o estado de autenticação garantido pelo `App.tsx`.
4.  **Resiliência no `Kanban`:** Adicionado tratamento de erro e carregamento mais suave no componente Kanban para evitar que falhas no tRPC causem tela branca.

## Como Validar
1.  Realize o login via portal Cognito.
2.  O `App.tsx` detectará a autenticação via OIDC.
3.  O `DashboardLayout` será renderizado, e o `Kanban` buscará os dados via tRPC.
4.  Não deve haver mais dependência de `localStorage` para a renderização inicial.

## Atualização: Correção do Erro "Failed to fetch" (tRPC 404/CORS)

### Problema Identificado
As chamadas tRPC estavam falhando com `404` ou `Failed to fetch` ao tentar acessar o endpoint da API na AWS. Isso ocorria porque:
1.  **Falta de Credenciais:** O cliente tRPC não estava configurado para enviar cookies de sessão (`credentials: 'include'`), o que é essencial para que o servidor identifique o usuário em requisições cross-origin (Vercel -> AWS).
2.  **Configuração de URL:** A URL da API precisa ser absoluta e estar corretamente apontada para o endpoint do tRPC.

### Correções Implementadas
1.  **Configuração do Cliente tRPC:** No `main.tsx`, o `httpBatchLink` foi atualizado para incluir `credentials: 'include'` na função `fetch`. Isso garante que o cookie `app_session_id` seja enviado em todas as requisições para a API.
2.  **Melhoria na Resiliência:** O componente `Kanban.tsx` já havia sido atualizado para tratar estados de erro, permitindo que o usuário tente novamente em caso de falha temporária.

### Como Validar
1.  Após o login, verifique no DevTools do navegador (aba Network) se as requisições para `/api/trpc/...` agora incluem o cabeçalho `Cookie` com o token de sessão.
2.  O status da resposta deve ser `200 OK` em vez de `404` ou erro de rede.

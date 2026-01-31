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

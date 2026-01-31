# Correções de Autenticação e Infraestrutura - Jarvis 2.0 MVP

## Problemas Identificados via AWS CLI

Após análise detalhada da infraestrutura AWS usando as credenciais fornecidas, identifiquei um descasamento crítico entre o código do servidor e a infraestrutura implantada:

1.  **Infraestrutura REST vs Servidor Express:** O API Gateway (`ucwealuc67`) está configurado como uma **HTTP API** com rotas granulares (`GET /tasks`, `POST /tasks`, etc.) apontando para Lambdas individuais. No entanto, o código do servidor no repositório foi construído como um monolito Express preparado para tRPC (esperando `/api/trpc`).
2.  **Falta de Rota Proxy:** O API Gateway não possui uma rota `{proxy+}`, o que causava o erro `404 Not Found` sempre que o frontend tentava acessar `/api/trpc/...`.
3.  **Autorização JWT:** As rotas de tarefas no API Gateway exigem autorização via Cognito (JWT), mas o cliente tRPC não estava enviando o `id_token` no cabeçalho `Authorization`.

## Correções Implementadas

### 1. Mapeamento de Rotas tRPC para REST
Como o frontend utiliza tRPC, mas a infraestrutura é REST, implementei um interceptador no `main.tsx` que traduz as chamadas:
- `tasks.list` -> `GET /tasks`
- `tasks.create` -> `POST /tasks`
- `tasks.update` -> `PATCH /tasks`

### 2. Injeção de Token JWT
O componente `TRPCProvider` no `main.tsx` agora captura o `id_token` do `react-oidc-context` e o injeta automaticamente no cabeçalho `Authorization` de todas as requisições para a AWS.

### 3. Ajuste de URL Base
Removido o prefixo `/api/trpc` forçado no cliente, permitindo que o tRPC utilize a URL base da AWS e as rotas mapeadas no API Gateway.

## Como Validar
1. Acesse o aplicativo e realize o login.
2. O `react-oidc-context` obterá o token do Cognito.
3. O interceptador do tRPC enviará a requisição para `https://ucwealuc67.execute-api.us-east-1.amazonaws.com/tasks` com o cabeçalho `Authorization`.
4. O Kanban deve carregar os dados das Lambdas individuais.

*Nota: Esta solução compatibiliza o código atual com a infraestrutura Terraform existente sem necessidade de redeploy da AWS.*

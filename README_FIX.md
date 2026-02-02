# Correção Crítica: API Errada e Configuração de CORS - Jarvis 2.0 MVP

## Problema Identificado via AWS CLI (Ação Final)

Após inspecionar ambas as APIs HTTP no seu console AWS via CLI, descobri o motivo do 404 persistente:

1.  **API Vazia:** A API `ucwealuc67` (que provavelmente está configurada no seu Vercel) está **completamente vazia** (0 rotas, 0 integrações). Por isso, qualquer chamada (GET ou OPTIONS) para `/tasks` nela retorna 404.
2.  **API Correta:** A API `putb1qrjo7` é a que contém todas as rotas funcionais (`GET /tasks`, `POST /tasks`, etc.).
3.  **Bloqueio de Preflight (OPTIONS):** O navegador envia uma requisição `OPTIONS` antes da requisição real. Se a API retorna 404 nessa fase, a requisição real nem chega a ser enviada.

## Correções Implementadas

### 1. Redirecionamento de Emergência no Frontend
No `main.tsx`, adicionei uma lógica que detecta se a URL base é a da API vazia (`ucwealuc67`) e a redireciona automaticamente para a API correta (`putb1qrjo7`). Isso corrige o problema sem você precisar alterar as variáveis de ambiente no Vercel agora.

### 2. Simplificação de Requisição (CORS)
Mudei `credentials: 'include'` para `omit` no fetch. Como estamos enviando o token via cabeçalho `Authorization`, não precisamos de cookies para a API. Isso reduz a complexidade do CORS e ajuda a evitar bloqueios do navegador.

### 3. Mapeamento de Rotas Mantido
O mapeamento de `tasks.list` -> `/tasks` continua ativo para garantir que o tRPC funcione com a sua infraestrutura REST.

## Ação Recomendada para Você
Para uma solução definitiva, **altere a variável `VITE_API_BASE_URL` no Vercel** para:
`https://putb1qrjo7.execute-api.us-east-1.amazonaws.com`

As correções já foram enviadas para o GitHub. Por favor, valide o carregamento do Kanban agora.

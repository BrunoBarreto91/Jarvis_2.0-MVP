# Relatório de Análise Técnica: Jarvis 2.0 MVP (Closet A Planner)

**Data:** 09/02/2026
**Autor:** Antigravity (Google Deepmind)
**Status do Projeto:** MVP (Fase 1 - Estabilização)

---

## 1. Conclusão Sobre o Propósito do Sistema

O sistema, internamente identificado como **"Closet A Planner"**, é uma ferramenta de gestão de tarefas operacional e estratégica, desenhada especificamente para um negócio de E-commerce com atuação multicanal.

**Evidências:**
*   **Nome no `package.json`:** "closet-a-planner".
*   **Domínio de Dados (`schema.ts` & `routers.ts`):**
    *   **Frentes de Trabalho:** O sistema divide as tarefas explicitamente em duas frentes:
        1.  `reativacao_ig` (Foco em Instagram/Marketing).
        2.  `canais_venda` (Foco em Marketplaces como ML, Shopee, TikTok Shop).
    *   **Tipos de Tarefa:** Categorias específicas como 'conteudo', 'cadastro_listing', 'politicas', 'logistica', 'criativos_ugc', 'ads'.
*   **Funcionalidades Específicas (`todo.md`):**
    *   Cálculo de "Carga Cognitiva" (para evitar sobrecarga do operador).
    *   Paleta de cores "Quiet Luxury" (indicando preocupação estética alinhada a um nicho de moda/lifestyle).

**Objetivo Central:** Organizar o fluxo de trabalho diário de uma operação de e-commerce, permitindo gestão visual (Kanban) e entrada rápida de dados via IA (Linguagem Natural), minimizando o atrito na criação de tarefas.

---

## 2. Tecnologias Utilizadas (Stack Tecnológica)

O projeto utiliza uma stack moderna, "Type-Safe" (tipagem forte de ponta a ponta) e Serverless.

| Camada | Tecnologia | Objetivo | Evidência |
| :--- | :--- | :--- | :--- |
| **Linguagem** | **TypeScript** | Segurança e robustez no código. | Arquivos `.ts`, `tsconfig.json`. |
| **Frontend** | **React 19 + Vite** | Interface reativa e rápida. | `package.json` (dependencies). |
| **Estilização** | **Tailwind CSS** | Design system utilitário. | `tailwind.config.js`, uso de `radix-ui`. |
| **Comunicação** | **tRPC** | Tipagem segura entre Front e Back. | `@trpc/server`, `@trpc/client`. |
| **Backend** | **Node.js (Express)** | Servidor de aplicação (provavelmente em Lambda). | `server/index.ts`. |
| **Banco de Dados** | **MySQL + Drizzle ORM** | Persistência Relacional. | `drizzle-orm`, `schema.ts`. |
| **Infraestrutura** | **AWS (S3, API Gateway)** | Hospedagem e armazenamento. | `@aws-sdk`, `README_FIX.md` (menção a APIs AWS). |
| **Inteligência** | **OpenAI API** | Processamento de Linguagem Natural. | `openai`, `taskParser.ts`. |

---

## 3. Estágio Atual do Desenvolvimento

O sistema encontra-se em **estágio avançado de MVP (Minimum Viable Product)**, focado em estabilização e correções pré-lançamento.

**Status Geral:** Funcional, mas em refinamento.

**Pontos Fortes (Concluídos - `[x]` no todo.md):**
*   Core do CRUD de tarefas (Criar, Ler, Atualizar, Deletar).
*   Visualização Kanban (Drag-and-drop).
*   Integração com IA para criar tarefas via texto (ex: "Criar task de anúncios para amanhã").
*   Estrutura de Banco de Dados definida e migrada.
*   Design System implementado.

**Desafios Atuais (Em aberto ou Recentes - `README_FIX.md`):**
*   **Infraestrutura:** Houve problemas recentes de configuração na AWS (API Gateway vazio, erros de CORS), que exigiram hotfixes manuais.
*   **Funcionalidades Pendentes:** Rotinas automáticas (matinal/semanal), gestão avançada de bloqueadores e testes automatizados ainda constam como pendentes no roadmap.
*   **Estrutura Duplicada?**: A existência de pastas `Jarvis_Reator_ARC` e `Jarvis_U.I` sugere uma possível refatoração ou separação do frontend em andamento, o que pode gerar confusão se não for consolidado.

**Resumo:** O "motor" está pronto, a "carroceria" está bonita, mas houve ajustes recentes no "chassi" (infraestrutura) para garantir que ele rode suavemente na estrada (produção).

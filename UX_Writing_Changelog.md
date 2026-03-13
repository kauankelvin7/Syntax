# UX Writing Changelog — Syntax Platform 📝

Este changelog documenta as alterações de textos, mensagens e personalidade da IA (Ada) realizadas para alinhar a plataforma com o novo Guia de Tom de Voz.

## 🔑 Autenticação (`LoginMinimal.jsx`)

| Elemento | Antes | Depois | Motivo |
| :--- | :--- | :--- | :--- |
| Título (Login) | "Establish_Session" | "Entrar" | Clareza universal e remoção de jargão inventado. |
| Título (Registro) | "Registry_Node" | "Criar conta" | Padrão reconhecível por desenvolvedores. |
| Subtítulo (Login) | "Credenciais para acesso ao mainframe" | "Entre com sua conta para continuar." | Tom profissional e direto. |
| Label Email | "Network_Address" | "Email" | Glossário oficial. |
| Label Senha | "Access_Hash" | "Senha" | Glossário oficial. |
| Placeholder | "node@syntax.network" | "seu@email.com" | Facilita o preenchimento intuitivo. |
| Erros | "Target_Not_Found:..." | "Email não encontrado. Crie..." | Padrão [O que aconteceu] + [O que fazer]. |

## 🤖 Agente Ada (`useSyntaxSessoes.js` & `AdaBot.jsx`)

| Elemento | Antes | Depois | Motivo |
| :--- | :--- | :--- | :--- |
| Boas-vindas | Genérico ("Qual o problema?") | Contextual e motivador | Demonstra as capacidades técnicas da Ada. |
| System Prompt | Focado em "Personalidade" | Focado em "Especialidades" | Melhora a precisão técnica da IA como Engenheira Sênior. |
| Títulos de Sessão | Truncava o texto | Categorias com ícones (🐛, 📐, ⚙️) | Melhor organização visual do histórico. |
| Erros de API | Jargão técnico (429, API Key) | Instruções claras de ação | Reduz a frustração do usuário em falhas técnicas. |

## 📊 Dashboard e Navegação (`Home.jsx`, `Materias.jsx`, `Resumos.jsx`, `Flashcards.jsx`)

| Elemento | Antes | Depois | Motivo |
| :--- | :--- | :--- | :--- |
| Badges de Status | "Node_Active" | "Online" | Humanização do sistema. |
| KPIs | "Streak", "Logic_Units", "Docs" | "Sequência", "Flashcards", "Resumos" | Consistência com o PT-BR padrão do glossário. |
| Empty States | "Repository_Empty" | "Repositório vazio" | Clareza e instrução para criar o primeiro item. |
| Botões de Ação | "Initialize_Sync", "Commit_Stack" | "Iniciar revisão", "Salvar Matéria" | Foco na tarefa do usuário, não no processo técnico. |

## ⚙️ Core e Contexto (`useSyntaxContext.js`)

| Campo | Antes | Depois | Motivo |
| :--- | :--- | :--- | :--- |
| `streakAtual` | `streakAtual` | `diasSeguidos` | PT-BR consistente. |
| `longestStreak` | `longestStreak` | `maiorSequencia` | Remoção de termos em EN desnecessários. |
| `totalResumos` | `totalResumos` | `resumosSalvos` | Reflete melhor o estado de persistência. |
| `ultimoProjeto` | (Não existia no estado) | `projetoRecente` | Adicionado para permitir saudações contextuais da Ada. |

---
*Alterações realizadas seguindo rigorosamente as Regras de Conduta do projeto Syntax.*

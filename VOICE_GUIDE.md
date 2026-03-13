# Syntax — Guia de Tom de Voz 🚀

## Quem é a plataforma Syntax
A **Syntax** é uma plataforma de estudos de alto desempenho para engenheiros de software. Ela combina inteligência artificial (Ada), repetição espaçada (SM-2) e documentação técnica para acelerar o aprendizado de conceitos complexos, desde algoritmos até arquitetura de sistemas.

## Quem é a Ada
A **Ada** é a sua assistente especializada em engenharia de software. Ela não é apenas um chatbot; ela é uma colega de profissão sênior, direta, didática e motivadora. Ela entende código, padrões de projeto e desafios reais de desenvolvimento.

## Glossário Oficial

| CONCEITO          | USE            | NUNCA USE             |
| :---------------- | :------------- | :-------------------- |
| Usuário           | você / dev     | node, cliente         |
| Conta             | conta          | registry, endpoint    |
| Chat              | conversa       | sessão, thread        |
| Agente de IA      | Ada            | bot, KakaBot, AI      |
| Senha             | senha          | hash, access key      |
| Email             | email          | network address       |
| Login             | entrar         | establish session     |
| Cadastro          | criar conta    | generate node         |

## Padrões de Mensagem

### ❌ O que evitar
- Jargões inventados que dificultam a compreensão (ex: "Registry_Node", "Logic_Unit").
- Mensagens de erro puramente técnicas sem instrução (ex: "Target_Not_Found").
- Mistura aleatória de PT-BR e EN.
- Tom frio ou excessivamente robótico.

### ✅ O que fazer
- **Padrão de erro**: `[O que aconteceu]` + `[O que fazer]`.
  - *Ex: "Email não encontrado. Verifique ou crie uma conta."*
- **Padrão de empty state**: `[O que está vazio]` + `[Ação para resolver]`.
  - *Ex: "Nenhuma conversa ainda. Comece uma nova sessão com a Ada."*
- **Padrão de loading**: Específico e contextual.
  - *Ex: "Carregando seu histórico de estudos..."*
- **Tom Dev-to-Dev**: Use termos técnicos consagrados (Code Review, Debug, Deploy, Stack) de forma natural no PT-BR.

## Regra de Ouro da Ada
Toda mensagem ou prompt da Ada deve ter **no máximo 2000 caracteres**. Isso garante performance e foco na resposta.

---
*Este guia deve ser seguido por todos os agentes e desenvolvedores para manter a consistência da plataforma Syntax.*

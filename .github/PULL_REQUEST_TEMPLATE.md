# Título

Use um título curto e descritivo: `feat(module): adicionar MeuAgente` ou `fix(plugin): corrigir carregamento de hooks`.

---

## Descrição
- Breve resumo do que foi alterado e o porquê.
- Referencie issues relacionadas: `Fixes #123` ou `Refs #456`.

## Como testar localmente
1. Instale dependências: `npm install`
2. Compile: `npm run build`
3. Execute testes: `npm test`
4. (Se aplicável) Rodar a CLI em modo dev e reproduzir o fluxo: `npm run dev` e executar o comando relacionado

## Checklist do autor
- [ ] Código compilou (`npm run build`)
- [ ] Testes adicionados e passando (`npm test`)
- [ ] Documentação atualizada (`docs/` ou `README.md`) quando aplicável
- [ ] Novos agentes foram exportados em `src/agents/index.ts` e, se necessário, registrados (veja `agentRegistry`)
- [ ] Plugins incluem `plugin.json` e handlers em `hooks/` quando aplicável
- [ ] Não há segredos ou chaves em commits

## Notas para o revisor
- Principais arquivos para revisar: `src/agents/`, `src/core/ai-service.ts`, `src/core/plugin-system.ts`, `docs/`
- Para PRs que adicionam agentes: verifique `instructions` e `menu` no agente, e que `createOutput()` é usado para padronizar saída
- Para PRs que modificam provedores de IA: verifique tratamento de erros e fallbacks

---

Obrigado! Marque qualquer revisor relevante e descreva como confirmar a mudança localmente. Se for um *breaking change*, indique claramente na descrição e proponha migração/rollback.

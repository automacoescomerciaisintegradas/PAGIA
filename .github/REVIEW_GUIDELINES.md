Guia rápido para revisões de PR

Objetivo: agilizar revisões mantendo qualidade e segurança.

1) Check inicial (mínimo)
- `npm run build` passa sem erros
- `npm test` passa (tests unitários e mocks adequados)
- Mudanças pequenas e focadas (sem arquivos gerados ou artefatos binários)
- Sem credenciais ou chaves em commits

2) Foco técnico conforme tipo de PR
- Agentes (em `src/agents/`):
  - Confirme que o agente estende `BaseAgent` e define `name`, `role`, `description`, `module`.
  - Verifique o uso de `callAI()` e `createOutput()` para garantir compatibilidade com eventos.
  - Se for um novo agente público, assegure export em `src/agents/index.ts`.
- Plugins (diretórios em `.pagia/plugins/` ou `examples/plugins/`):
  - Verifique `plugin.json`, handlers em `hooks/` e agentes em `agents/`.
  - Confirme que não há instruções secretas embedadas (API keys, tokens).
- Core / Provedores (ex.: `src/core/ai-service.ts`):
  - Verifique mensagens de erro, fallbacks e logs.
  - Testes de integração/mocks sugeridos para mudanças de infra.

3) Segurança e documentação
- Documentação atualizada (`docs/` e README) para comportamentos visíveis.
- Se há variáveis de ambiente novas, adicione exemplos no README e no template `.env.sample` (se existir).

4) Aprovação e merge
- Prefira merges *squash* para manter histórico limpo salvo se houver motivo diferente.
- Para PRs grandes: peça pelo menos 2 revisores e mudanças em etapas pequenas (se possível).

5) Dicas do revisor
- Use `git checkout <branch>` e rode localmente os passos em "Como testar localmente" no template de PR.
- Se o PR afeta agentes, execute `pagia agent list` para ver se o agente exposto aparece (após build/link local).
- Para dúvidas, comente pedindo um cenário de reprodução ou exemplo de input/expected output.

Obrigado por revisar com cuidado! 🚀

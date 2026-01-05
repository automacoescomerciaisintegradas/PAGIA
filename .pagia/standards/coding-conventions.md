# Convenções de Código PAGIA

## Geral
- **Idioma**: Código (nomes de variáveis, funções, classes) em **Inglês**. Comentários e documentação em **Português**.
- **Indentação**: 4 espaços.
- **Line Endings**: LF (preferencialmente).

## TypeScript
- Ativar `strict: true` no `tsconfig.json`.
- Evitar o uso de `any`. Preferir `unknown` ou definir interfaces.
- Usar `interface` para definições de objetos e `type` para uniões ou tipos simples.
- Exportar membros de forma explícita.

## Nomenclatura
- **Classes**: PascalCase (ex: `ConfigManager`)
- **Interfaces**: PascalCase (ex: `AIProvider`)
- **Funções/Variáveis**: camelCase (ex: `loadConfig`)
- **Arquivos**: kebab-case (ex: `multi-provider.ts`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `DEFAULT_PORT`)

## Organização de Arquivos
- Um componente/classe principal por arquivo.
- Manter arquivos pequenos (idealmente < 300 linhas).
- Funções utilitárias devem ser movidas para a pasta `utils/`.

## Tratamento de Erros
- Nunca silenciar erros com blocos `catch` vazios.
- Usar `logger.error` ou lançar erros descritivos.
- Em comandos CLI, falhar graciosamente com mensagens coloridas.

## Documentação
- Usar JSDoc para funções e classes complexas.
- Manter o `README.md` e as `specs` atualizadas.

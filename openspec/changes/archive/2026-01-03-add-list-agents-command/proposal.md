# Change: Add List Agents Command

## Why
Currently, users cannot easily view all configured AI agents from the CLI. They need visibility into which agents are available, their providers, and their status to manage them effectively.

## What Changes
- Add a new `list` subcommand to the `agent` command group (`pagia agent list`).
- The command will display a formatted table of agents.
- Columns will include: Name, Provider, Model, and Status.

## Impact
- **CLI**: Updates `src/commands/agent.ts` to include the new subcommand.
- **UX**: Provides immediate feedback on agent configuration.

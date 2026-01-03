# cli Specification

## Purpose
TBD - created by archiving change add-list-agents-command. Update Purpose after archive.
## Requirements
### Requirement: List AI Agents
The system SHALL provide a CLI command to list all configured AI agents.

#### Scenario: User lists agents successfully
- **WHEN** the user runs `pagia agent list`
- **THEN** the system displays a table of all configured agents
- **AND** the table includes columns for Name, Provider, and Model

#### Scenario: No agents configured
- **WHEN** the user runs `pagia agent list`
- **AND** no agents are configured
- **THEN** the system displays a friendly message indicating no agents were found


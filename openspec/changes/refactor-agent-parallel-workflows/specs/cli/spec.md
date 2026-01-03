# Delta for CLI

## ADDED Requirements

### Requirement: Workflow Management Commands

The system SHALL provide CLI commands for managing and executing agent workflows.

#### Scenario: List available workflows
- **WHEN** user runs `pagia workflow list`
- **THEN** the system displays all workflows in `.pagia/workflows/`
- **AND** shows name, description, and node count for each
- **AND** indicates validation status

#### Scenario: Run a workflow
- **WHEN** user runs `pagia workflow run <name>`
- **THEN** the workflow is loaded from `.pagia/workflows/<name>.yaml`
- **AND** the workflow is validated
- **AND** execution begins with real-time progress output
- **AND** final result is displayed

#### Scenario: Run workflow with input
- **WHEN** user runs `pagia workflow run <name> --input '{"key": "value"}'`
- **THEN** the JSON input is parsed
- **AND** passed as initial context to the workflow

#### Scenario: Watch workflow execution
- **WHEN** user runs `pagia workflow run <name> --watch`
- **THEN** real-time events are displayed
- **AND** each node start/complete is shown with timestamps
- **AND** parallel branches are visually indicated

#### Scenario: Visualize workflow structure
- **WHEN** user runs `pagia workflow visualize <name>`
- **THEN** an ASCII representation of the DAG is displayed
- **AND** shows node names, agent types, and dependencies

#### Scenario: Validate workflow definition
- **WHEN** user runs `pagia workflow validate <name>`
- **THEN** the workflow is loaded and validated
- **AND** any errors are displayed with line numbers
- **AND** exit code is 0 for valid, 1 for invalid

#### Scenario: Create workflow scaffold
- **WHEN** user runs `pagia workflow create <name>`
- **THEN** a new workflow file is created at `.pagia/workflows/<name>.yaml`
- **AND** the file contains a template with comments explaining the format

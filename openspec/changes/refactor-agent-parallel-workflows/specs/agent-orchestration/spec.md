# Agent Orchestration Specification

## Purpose

Define as capacidades de orquestração de agentes no PAGIA, incluindo composição, execução paralela, e workflows baseados em DAG.

## ADDED Requirements

### Requirement: Workflow Engine

The system MUST provide a WorkflowEngine that executes agent workflows defined as Directed Acyclic Graphs (DAG).

#### Scenario: Execute simple linear workflow
- **WHEN** a workflow with nodes A → B → C is defined
- **AND** the workflow is executed
- **THEN** Agent A executes first
- **AND** Agent B executes after A completes
- **AND** Agent C executes after B completes
- **AND** the final result aggregates all outputs

#### Scenario: Execute parallel branches
- **WHEN** a workflow with nodes A → [B, C] → D is defined (B and C have no dependency between them)
- **AND** the workflow is executed
- **THEN** Agent A executes first
- **AND** Agents B and C execute in parallel after A completes
- **AND** Agent D executes after both B and C complete
- **AND** total execution time is less than sequential execution

#### Scenario: Respect concurrency limits
- **WHEN** a workflow has 10 parallel nodes
- **AND** maxConcurrency is set to 3
- **THEN** at most 3 agents execute simultaneously
- **AND** remaining agents queue until a slot becomes available

#### Scenario: Handle node failure with retry
- **WHEN** a workflow node fails on first attempt
- **AND** retryPolicy allows 3 attempts
- **THEN** the engine retries with exponential backoff
- **AND** emits `workflow:node:retry` event

#### Scenario: Abort on unrecoverable failure
- **WHEN** a workflow node exhausts all retry attempts
- **THEN** the workflow is marked as failed
- **AND** emits `workflow:failed` event with error details
- **AND** partial results are available in the response

### Requirement: DAG Validation

The system MUST validate workflow definitions before execution.

#### Scenario: Detect cycles in workflow
- **WHEN** a workflow definition contains a cycle (A → B → C → A)
- **THEN** validation fails with "Cycle detected" error
- **AND** the cycle path is included in the error message

#### Scenario: Detect invalid edge references
- **WHEN** an edge references a non-existent node
- **THEN** validation fails with "Invalid node reference" error

#### Scenario: Validate minimal structure
- **WHEN** a workflow has no nodes
- **THEN** validation fails with "Workflow must have at least one node"

### Requirement: Workflow Events

The system MUST emit events during workflow execution for observability.

#### Scenario: Emit workflow lifecycle events
- **WHEN** a workflow is executed
- **THEN** `workflow:started` emits with workflow ID and definition
- **AND** `workflow:node:started` emits for each node when it begins
- **AND** `workflow:node:completed` emits for each node when it finishes
- **AND** `workflow:completed` emits when all nodes finish successfully

#### Scenario: Include execution metrics in events
- **WHEN** `workflow:completed` event is emitted
- **THEN** it includes total execution time
- **AND** it includes per-node execution times
- **AND** it includes total tokens used

### Requirement: Workflow Definition Storage

The system SHALL support loading workflow definitions from files.

#### Scenario: Load workflow from YAML file
- **WHEN** user runs `pagia workflow run my-workflow`
- **AND** file `.pagia/workflows/my-workflow.yaml` exists
- **THEN** the workflow is loaded and validated
- **AND** execution begins

#### Scenario: List available workflows
- **WHEN** user runs `pagia workflow list`
- **THEN** all workflows in `.pagia/workflows/` are listed
- **AND** each entry shows name, description, and node count

### Requirement: Workflow Visualization

The system SHALL provide a way to visualize workflow structure.

#### Scenario: Display ASCII DAG
- **WHEN** user runs `pagia workflow visualize my-workflow`
- **THEN** an ASCII representation of the DAG is displayed
- **AND** nodes show their names and agent types
- **AND** edges show dependencies

## MODIFIED Requirements

### Requirement: Agent Composition

The system SHALL provide composition strategies for combining multiple agents.

#### Scenario: Compose agents with DAG strategy
- **WHEN** user calls `agentComposer.composeDAG(definition)`
- **THEN** a ComposedAgent is created
- **AND** executing the composed agent runs the DAG workflow
- **AND** results are aggregated according to the aggregator function

#### Scenario: Parallel execution with concurrency control
- **WHEN** a ComposedAgent uses 'parallel' strategy
- **AND** maxConcurrency is specified
- **THEN** at most maxConcurrency agents run simultaneously
- **AND** default maxConcurrency is 5

#### Scenario: Resilient parallel execution
- **WHEN** a ComposedAgent uses 'parallel' strategy with `failFast: false`
- **AND** one agent fails
- **THEN** other agents continue executing
- **AND** final result includes both successful outputs and errors

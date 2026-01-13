# PAGIA CLI Usage

This guide describes how to use the PAGIA command-line interface for build automation, specification management, and autonomous workflows.

## Headless Operation and CI/CD

For automated workflows, navigate to the backend directory:

```bash
cd apps/backend
```

### 1. Create a Spec
Start creating an interactive spec to define a new set of tasks or features:

```bash
python spec_runner.py --interactive
```

### 2. Run Autonomous Build
Start an agent to execute the tasks defined in a specification:

```bash
python run.py --spec 001
```

### 3. Review and Merge
After work completion by the agent, you can review the changes and merge:

```bash
# Review changes
python run.py --spec 001 --review

# Merge to main code
python run.py --spec 001 --merge
```

## CLI Features

- **Interactivity**: Step-by-step assistant for new tasks.
- **Autonomy**: Agents that execute code, run tests, and fix errors automatically.
- **Integration**: Ready for use in Continuous Integration pipelines.

---
*Documentation inspired by the BMAD framework.*

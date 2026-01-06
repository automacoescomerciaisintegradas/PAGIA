/**
 * PAGIA Type Definitions
 */

// ============================================
// Configuration Types
// ============================================

export interface PAGIAConfig {
    projectRoot: string;
    pagiaFolder: string;
    language: string;
    userName: string;
    debug: boolean;
    aiProvider: AIProvider;
    modules: ModuleConfig[];
}

export type AIProviderType = 'gemini' | 'openai' | 'anthropic' | 'groq' | 'ollama' | 'deepseek' | 'deepseek-beta' | 'mistral' | 'openrouter' | 'local' | 'qwen' | 'coder' | 'claude-coder' | 'nvidia';

export interface AIProvider {
    type: AIProviderType;
    apiKey: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
}

export interface ModuleConfig {
    code: string;
    name: string;
    enabled: boolean;
    config: Record<string, unknown>;
}

// ============================================
// Module Types
// ============================================

export interface Module {
    code: string;
    name: string;
    description: string;
    version: string;
    dependencies: string[];
    agents: Agent[];
    tasks: Task[];
    workflows: Workflow[];
}

export interface ModuleManifest {
    code: string;
    name: string;
    description: string;
    version: string;
    dependencies: string[];
    configSchema: ConfigSchema;
}

export interface ConfigSchema {
    [key: string]: {
        type: 'string' | 'number' | 'boolean' | 'array' | 'object';
        prompt: string;
        default?: unknown;
        required?: boolean;
        options?: string[];
    };
}

// ============================================
// Agent Types
// ============================================

export interface Agent {
    id: string;
    name: string;
    role: string;
    module: string;
    description: string;
    capabilities: string[];
    instructions: string;
    menu?: AgentMenuItem[];
    localSkip?: boolean;
    configurable?: AgentConfigurable[];
}

export interface AgentMenuItem {
    trigger: string;
    description: string;
    workflow?: string;
    workflowInstall?: string;
    action?: string;
}

export interface AgentConfigurable {
    key: string;
    value: string;
    isAgentConfig: boolean;
}

// ============================================
// Task Types
// ============================================

export interface Task {
    id: string;
    name: string;
    description: string;
    module: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignedAgent?: string;
    dependencies: string[];
    checklist: ChecklistItem[];
    metadata: TaskMetadata;
    createdAt: Date;
    updatedAt: Date;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    completedAt?: Date;
}

export interface TaskMetadata {
    source: 'global' | 'stage' | 'prompt' | 'ai';
    stageId?: string;
    promptId?: string;
    aiGenerated?: boolean;
    tags: string[];
}

// ============================================
// Workflow Types
// ============================================

export interface Workflow {
    id: string;
    name: string;
    description: string;
    module: string;
    steps: WorkflowStep[];
    configSource: string;
}

export interface WorkflowStep {
    id: string;
    name: string;
    type: 'action' | 'decision' | 'input' | 'output';
    agent?: string;
    task?: string;
    next?: string | WorkflowCondition[];
}

export interface WorkflowCondition {
    condition: string;
    next: string;
}

// ============================================
// Plan of Action Types (4 Modules)
// ============================================

// 1. Plano de Ação Global de Alto Nível
export interface GlobalPlan {
    id: string;
    name: string;
    description: string;
    objectives: Objective[];
    stages: Stage[];
    milestones: Milestone[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Objective {
    id: string;
    title: string;
    description: string;
    keyResults: KeyResult[];
    status: 'not-started' | 'in-progress' | 'achieved';
}

export interface KeyResult {
    id: string;
    description: string;
    targetValue: number;
    currentValue: number;
    unit: string;
}

export interface Milestone {
    id: string;
    name: string;
    dueDate: Date;
    status: 'pending' | 'completed' | 'overdue';
    deliverables: string[];
}

// 2. Plano de Ação Baseado na Etapa/Tópico
export interface Stage {
    id: string;
    name: string;
    description: string;
    order: number;
    status: 'not-started' | 'in-progress' | 'completed';
    topics: Topic[];
    tasks: Task[];
    dependencies: string[];
}

export interface Topic {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    notes: string[];
    resources: Resource[];
}

export interface Resource {
    type: 'file' | 'url' | 'reference';
    path: string;
    description: string;
}

// 3. Plano de Ação Baseado no Prompt
export interface PromptPlan {
    id: string;
    prompt: string;
    interpretation: string;
    generatedTasks: Task[];
    suggestedWorkflow?: Workflow;
    confidence: number;
    createdAt: Date;
}

// 4. Plano de Ação Controlado pela IA
export interface AIPlan {
    id: string;
    context: string;
    analysis: AIAnalysis;
    recommendations: AIRecommendation[];
    automatedTasks: Task[];
    learnings: AILearning[];
    createdAt: Date;
}

export interface AIAnalysis {
    currentState: string;
    blockers: string[];
    opportunities: string[];
    risks: string[];
}

export interface AIRecommendation {
    id: string;
    type: 'task' | 'workflow' | 'resource' | 'priority';
    description: string;
    rationale: string;
    priority: TaskPriority;
    accepted?: boolean;
}

export interface AILearning {
    id: string;
    pattern: string;
    insight: string;
    applicability: string[];
    createdAt: Date;
}

// ============================================
// Update Todos Process
// ============================================

export interface TodoUpdate {
    id: string;
    type: 'sync' | 'reconcile' | 'propagate';
    affectedTasks: string[];
    changes: TodoChange[];
    timestamp: Date;
}

export interface TodoChange {
    taskId: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
    reason: string;
}

// ============================================
// Event Types
// ============================================

export interface PAGIAEvent {
    type: string;
    payload: unknown;
    timestamp: Date;
    source: string;
}

// ============================================
// CLI Types
// ============================================

export interface CLIContext {
    config: PAGIAConfig;
    projectRoot: string;
    verbose: boolean;
}

export interface CommandResult {
    success: boolean;
    message: string;
    data?: unknown;
    errors?: string[];
}

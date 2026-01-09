/**
 * PAGIA - Conductor Agent
 * Agente inspirado no Conductor para Desenvolvimento Orientado por Contexto
 *
 * @module agents/specialized/conductor-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
import type { AIProvider } from '../../types/index.js';
export type TrackType = 'feature' | 'bugfix' | 'improvement' | 'refactor';
export type TrackStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';
export interface Track {
    id: string;
    title: string;
    description: string;
    type: TrackType;
    status: TrackStatus;
    createdAt: Date;
    updatedAt: Date;
    phases: Phase[];
}
export interface Phase {
    id: string;
    name: string;
    status: TaskStatus;
    tasks: Task[];
    checkpoint?: string;
}
export interface Task {
    id: string;
    name: string;
    description: string;
    status: TaskStatus;
    commitSha?: string;
    tests?: string[];
}
export interface ProjectContext {
    product: string;
    productGuidelines: string;
    techStack: string;
    workflow: string;
    codeStyleguides: string[];
}
/**
 * Classe ConductorAgent - Gerente de projeto proativo
 * Implementa Context-Driven Development
 */
export declare class ConductorAgent extends BaseAgent {
    readonly name = "Agente Conductor";
    readonly role = "Gerente de Projeto Proativo";
    readonly description = "Gerencia o ciclo de vida completo de desenvolvimento: Contexto \u2192 Spec & Plan \u2192 Implement";
    readonly module = "conductor";
    private conductorPath;
    private context;
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    constructor(conductorPath?: string, aiProvider?: Partial<AIProvider>);
    /**
     * Executa comando do Conductor
     */
    execute(input: AgentInput): Promise<AgentOutput>;
    /**
     * /setup - Configurar projeto
     */
    private executeSetup;
    /**
     * /newTrack - Criar nova track
     */
    private executeNewTrack;
    /**
     * /implement - Implementar próxima tarefa
     */
    private executeImplement;
    /**
     * /status - Verificar status
     */
    private executeStatus;
    /**
     * /revert - Reverter trabalho
     */
    private executeRevert;
    /**
     * /checkpoint - Criar checkpoint
     */
    private executeCheckpoint;
    /**
     * Comando geral
     */
    private executeGeneral;
    /**
     * Carrega contexto do projeto
     */
    private loadContext;
    /**
     * Carrega arquivo do conductor
     */
    private loadFile;
    /**
     * Parseia arquivos do output da IA
     */
    private parseFiles;
    /**
     * Encontra track ativa
     */
    private findActiveTrack;
    /**
     * Encontra próxima tarefa pendente
     */
    private findNextPendingTask;
    /**
     * Lista tracks pendentes
     */
    private listPendingTracks;
    /**
     * Atualiza índice de tracks
     */
    private updateTracksIndex;
    /**
     * Define caminho do conductor
     */
    setConductorPath(path: string): void;
    /**
     * /parallel - Executar tarefas paralelas
     *
     * Detecta blocos de tarefas paralelas no plan.md usando a sintaxe:
     * <!-- parallel-start -->
     * - [ ] Tarefa A
     * - [ ] Tarefa B
     * - [ ] Tarefa C
     * <!-- parallel-end -->
     *
     * E executa todas as tarefas simultaneamente usando o WorkflowEngine.
     */
    private executeParallel;
    /**
     * Parseia blocos paralelos do plan.md
     */
    private parseParallelBlocks;
    /**
     * Parseia tarefas de um bloco
     */
    private parseTasksFromBlock;
    /**
     * Constrói workflow DAG para tarefas paralelas
     */
    private buildParallelWorkflow;
}
export declare const conductorAgent: ConductorAgent;
//# sourceMappingURL=conductor-agent.d.ts.map
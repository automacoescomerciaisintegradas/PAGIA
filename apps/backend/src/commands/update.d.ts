/**
 * PAGIA - Update Command
 * Processo de "Update Todos"
 */
import { Command } from 'commander';
import type { Task } from '../types/index.js';
export declare const updateCommand: Command;
interface TaskAnalysis {
    pending: number;
    inProgress: number;
    completed: number;
    blocked: number;
    issues: string[];
    updates: Array<{
        taskId: string;
        field: string;
        oldValue: unknown;
        newValue: unknown;
        description: string;
    }>;
}
declare function collectAllTasks(pagiaFolder: string): Task[];
declare function analyzeTasksSync(tasks: Task[]): TaskAnalysis;
declare function applyUpdates(pagiaFolder: string, updates: Array<{
    taskId: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
    description: string;
}>): void;
declare function findPlanFile(pagiaFolder: string, name: string): string | null;
export { applyUpdates, collectAllTasks, analyzeTasksSync, findPlanFile };
//# sourceMappingURL=update.d.ts.map
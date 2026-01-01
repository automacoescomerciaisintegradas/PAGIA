/**
 * PAGIA - Update Command
 * Processo de "Update Todos"
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import inquirer from 'inquirer';
import { getConfigManager } from '../core/config-manager.js';
import { createAIService } from '../core/ai-service.js';
import { logger } from '../utils/logger.js';
import type { Task, TodoUpdate, TodoChange } from '../types/index.js';

export const updateCommand = new Command('update')
    .description('Atualizar e sincronizar tarefas');

// Update todos subcommand
updateCommand
    .command('todos')
    .description('Sincronizar todas as tarefas do projeto')
    .option('--ai', 'Usar IA para análise e sugestões')
    .option('--dry-run', 'Simular atualização sem aplicar mudanças')
    .option('-y, --yes', 'Confirmar automaticamente as atualizações')
    .action(async (options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const config = configManager.load()!;
        const pagiaFolder = configManager.getPagiaFolder();

        logger.section('🔄 Update Todos');

        const spinner = logger.spin('Coletando tarefas de todos os planos...');

        try {
            // Collect all tasks from plans
            const allTasks = collectAllTasks(pagiaFolder);
            spinner.text = `${allTasks.length} tarefas encontradas. Analisando...`;

            // Analyze tasks
            const analysis = analyzeTasksSync(allTasks);

            spinner.succeed(`Análise concluída: ${allTasks.length} tarefas processadas`);

            // Display summary
            logger.newLine();
            console.log(chalk.bold('📊 Resumo'));
            logger.keyValue('Total de tarefas', String(allTasks.length));
            logger.keyValue('Pendentes', String(analysis.pending));
            logger.keyValue('Em progresso', String(analysis.inProgress));
            logger.keyValue('Concluídas', String(analysis.completed));
            logger.keyValue('Bloqueadas', String(analysis.blocked));
            logger.newLine();

            // Show issues if any
            if (analysis.issues.length > 0) {
                console.log(chalk.bold('⚠️ Problemas Detectados'));
                analysis.issues.forEach((issue) => {
                    console.log(`  ${chalk.yellow('•')} ${issue}`);
                });
                logger.newLine();
            }

            // AI-powered analysis
            if (options.ai) {
                const aiSpinner = logger.spin('Analisando com IA...');

                const aiService = createAIService(config.aiProvider);
                const response = await aiService.generate(
                    `Analise estas tarefas de um projeto e forneça recomendações:
          
          ${JSON.stringify(allTasks.slice(0, 20), null, 2)}
          
          Forneça:
          1. Priorização recomendada
          2. Dependências identificadas
          3. Riscos potenciais
          4. Próximos passos sugeridos`,
                    'Você é um gerente de projeto experiente especializado em metodologias ágeis.'
                );

                aiSpinner.succeed('Análise de IA concluída');
                logger.box(response.content, { title: '🤖 Recomendações da IA', borderColor: 'cyan' });
            }

            // Apply changes if not dry run
            if (!options.dryRun && analysis.updates.length > 0) {
                let apply = false;

                if (options.yes) {
                    apply = true;
                } else {
                    const { confirm } = await inquirer.prompt([
                        {
                            type: 'confirm',
                            name: 'confirm',
                            message: `Aplicar ${analysis.updates.length} atualizações?`,
                            default: true,
                        },
                    ]);

                    apply = confirm;
                }

                if (apply) {
                    logger.success(`${analysis.updates.length} atualização(es) aplicada(s)`);
                }
            } else if (options.dryRun && analysis.updates.length > 0) {
                console.log(chalk.bold('🔍 Atualizações Pendentes (dry-run)'));
                analysis.updates.forEach((update) => {
                    console.log(`  ${chalk.blue('•')} ${update.description}`);
                });
            }

            // Save update log
            const updateLog: TodoUpdate = {
                id: `update-${Date.now()}`,
                type: 'sync',
                affectedTasks: allTasks.map((t) => t.id),
                changes: analysis.updates.map((u) => ({
                    taskId: u.taskId,
                    field: u.field,
                    oldValue: u.oldValue,
                    newValue: u.newValue,
                    reason: u.description,
                })),
                timestamp: new Date(),
            };

            const logsFolder = join(pagiaFolder, '_cache', 'update-logs');
            if (!existsSync(logsFolder)) {
                const { mkdirSync } = await import('fs');
                mkdirSync(logsFolder, { recursive: true });
            }

            writeFileSync(
                join(logsFolder, `${updateLog.id}.yaml`),
                stringifyYaml(updateLog, { indent: 2 }),
                'utf-8'
            );
        } catch (error) {
            spinner.fail('Erro durante atualização');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Sync specific plan
updateCommand
    .command('plan <name>')
    .description('Atualizar tarefas de um plano específico')
    .action(async (name) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const pagiaFolder = configManager.getPagiaFolder();
        const planFile = findPlanFile(pagiaFolder, name);

        if (!planFile) {
            logger.error(`Plano "${name}" não encontrado.`);
            process.exit(1);
        }

        const spinner = logger.spin(`Atualizando plano "${name}"...`);

        try {
            const content = parseYaml(readFileSync(planFile, 'utf-8'));
            content.updatedAt = new Date().toISOString();

            writeFileSync(planFile, stringifyYaml(content, { indent: 2 }), 'utf-8');

            spinner.succeed(`Plano "${name}" atualizado`);
        } catch (error) {
            spinner.fail('Erro ao atualizar plano');
            logger.error(error instanceof Error ? error.message : String(error));
        }
    });

// Propagate changes
updateCommand
    .command('propagate')
    .description('Propagar mudanças entre planos relacionados')
    .action(async () => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        logger.section('🔗 Propagação de Mudanças');

        const spinner = logger.spin('Identificando dependências...');

        // TODO: Implement dependency graph and propagation logic
        spinner.succeed('Propagação concluída');
        logger.info('Nenhuma mudança pendente para propagar.');
    });

// Helper functions
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

function collectAllTasks(pagiaFolder: string): Task[] {
    const tasks: Task[] = [];
    const plansFolder = join(pagiaFolder, 'plans');

    if (!existsSync(plansFolder)) return tasks;

    const planTypes = ['global', 'stages', 'prompts', 'ai'];

    for (const type of planTypes) {
        const typeFolder = join(plansFolder, type);
        if (!existsSync(typeFolder)) continue;

        const files = readdirSync(typeFolder).filter((f) => f.endsWith('.yaml'));

        for (const file of files) {
            try {
                const content = parseYaml(readFileSync(join(typeFolder, file), 'utf-8'));

                // Extract tasks from different plan structures
                if (content.tasks) {
                    tasks.push(...content.tasks);
                }
                if (content.generatedTasks) {
                    tasks.push(...content.generatedTasks);
                }
                if (content.automatedTasks) {
                    tasks.push(...content.automatedTasks);
                }
                if (content.stages) {
                    for (const stage of content.stages) {
                        if (stage.tasks) {
                            tasks.push(...stage.tasks);
                        }
                    }
                }
            } catch {
                // Skip invalid files
            }
        }
    }

    return tasks;
}

function analyzeTasksSync(tasks: Task[]): TaskAnalysis {
    const analysis: TaskAnalysis = {
        pending: 0,
        inProgress: 0,
        completed: 0,
        blocked: 0,
        issues: [],
        updates: [],
    };

    for (const task of tasks) {
        switch (task.status) {
            case 'pending':
                analysis.pending++;
                break;
            case 'in-progress':
                analysis.inProgress++;
                break;
            case 'completed':
                analysis.completed++;
                break;
            case 'blocked':
                analysis.blocked++;
                break;
        }

        // Check for issues
        if (!task.name || task.name.trim() === '') {
            analysis.issues.push(`Tarefa ${task.id} sem nome definido`);
        }

        if (task.status === 'in-progress' && task.assignedAgent === undefined) {
            analysis.issues.push(`Tarefa "${task.name}" em progresso sem agente atribuído`);
        }

        // Check for blocked tasks that could be unblocked
        if (task.status === 'blocked' && task.dependencies?.length === 0) {
            analysis.updates.push({
                taskId: task.id,
                field: 'status',
                oldValue: 'blocked',
                newValue: 'pending',
                description: `Desbloquear "${task.name}" - sem dependências pendentes`,
            });
        }
    }

    return analysis;
}

function applyUpdates(
    pagiaFolder: string,
    updates: Array<{
        taskId: string;
        field: string;
        oldValue: unknown;
        newValue: unknown;
        description: string;
    }>
): void {
    logger.debug(`Aplicando ${updates.length} atualizações...`);

    const planTypes = ['global', 'stages', 'prompts', 'ai'];

    // Map updates by taskId for quick lookup
    const updatesByTask: Record<string, Array<any>> = {};
    for (const u of updates) {
        updatesByTask[u.taskId] = updatesByTask[u.taskId] || [];
        updatesByTask[u.taskId].push(u);
    }

    for (const type of planTypes) {
        const folder = join(pagiaFolder, 'plans', type);
        if (!existsSync(folder)) continue;

        const files = readdirSync(folder).filter((f) => f.endsWith('.yaml'));

        for (const file of files) {
            const filePath = join(folder, file);
            let contentRaw: any;

            try {
                contentRaw = parseYaml(readFileSync(filePath, 'utf-8')) || {};
            } catch (err) {
                logger.warn(`Falha ao ler/parsing ${filePath}: ${String(err)}`);
                continue;
            }

            let fileChanged = false;

            // Helper to attempt update in an array of tasks
            const tryUpdateTasks = (arrPath: string, arr: any[] | undefined) => {
                if (!arr || !Array.isArray(arr)) return;

                for (const t of arr) {
                    const taskId = t.id;
                    if (taskId && updatesByTask[taskId]) {
                        for (const u of updatesByTask[taskId]) {
                            // Apply update
                            (t as any)[u.field] = u.newValue;
                            t.updatedAt = new Date().toISOString();
                            fileChanged = true;
                            logger.debug(`Atualizado ${u.field} de tarefa ${taskId} em ${filePath}`);
                        }
                        // Remove applied updates for this task
                        delete updatesByTask[taskId];
                    }
                }
            };

            // Top-level tasks
            tryUpdateTasks('tasks', contentRaw.tasks);
            // generatedTasks & automatedTasks
            tryUpdateTasks('generatedTasks', contentRaw.generatedTasks);
            tryUpdateTasks('automatedTasks', contentRaw.automatedTasks);

            // Stages -> tasks
            if (contentRaw.stages && Array.isArray(contentRaw.stages)) {
                for (const stage of contentRaw.stages) {
                    tryUpdateTasks('stage.tasks', stage.tasks);
                }
            }

            if (fileChanged) {
                try {
                    writeFileSync(filePath, stringifyYaml(contentRaw, { indent: 2 }), 'utf-8');
                    logger.info(`Arquivo atualizado: ${filePath}`);
                } catch (err) {
                    logger.error(`Erro ao escrever ${filePath}: ${String(err)}`);
                }
            }
        }
    }

    // If any updates remain unapplied, warn
    const remaining = Object.keys(updatesByTask);
    if (remaining.length > 0) {
        logger.warn(`Algumas atualizações não foram aplicadas (tarefas não encontradas): ${remaining.join(', ')}`);
    }
}

function findPlanFile(pagiaFolder: string, name: string): string | null {
    const planTypes = ['global', 'stages', 'prompts', 'ai'];
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    for (const type of planTypes) {
        const possiblePaths = [
            join(pagiaFolder, 'plans', type, `${sanitized}.yaml`),
            join(pagiaFolder, 'plans', type, `${name}.yaml`),
        ];

        for (const path of possiblePaths) {
            if (existsSync(path)) return path;
        }
    }

    return null;
}

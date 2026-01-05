/**
 * PAGIA - Workflow Command
 * Gerenciamento de Workflows
 * 
 * @module commands/workflow
 * @author Automações Comerciais Integradas
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import yaml from 'yaml';
import { logger } from '../utils/logger.js';
import { getConfigManager } from '../core/config-manager.js';
import { workflowEngine } from '../agents/workflow-engine.js';
import { validateWorkflow, DAGBuilder, serializeWorkflow } from '../agents/workflow-dag.js';
import { eventBus, PAGIAEvents } from '../core/event-bus.js';
import type { WorkflowDefinition, WorkflowConfig } from '../agents/workflow-types.js';
import { START_NODE_ID, END_NODE_ID, DEFAULT_WORKFLOW_CONFIG } from '../agents/workflow-types.js';
import { detectFormat, convertN8nToPagia, convertNodeRedToPagia } from '../utils/workflow-converter.js';

export const workflowCommand = new Command('workflow')
    .description('Gerenciar workflows de agentes');

// ============================================================================
// List Workflows
// ============================================================================

workflowCommand
    .command('list')
    .description('Listar workflows disponíveis')
    .option('-v, --verbose', 'Mostrar detalhes adicionais')
    .action(async (options) => {
        logger.section('Workflows Disponíveis');

        const configManager = getConfigManager();
        if (!configManager.isInitialized()) {
            logger.warn('PAGIA não foi inicializado. Execute `pagia init` primeiro.');
            return;
        }

        const workflowsDir = join(configManager.getPagiaFolder(), 'workflows');

        if (!existsSync(workflowsDir)) {
            logger.info('Nenhum workflow encontrado.');
            logger.info(`Crie workflows em: ${workflowsDir}`);
            return;
        }

        console.log(chalk.dim(`📂 Local: ${workflowsDir}\n`));

        const files = readdirSync(workflowsDir).filter(f =>
            f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.json')
        );

        if (files.length === 0) {
            logger.info('Nenhum workflow encontrado.');
            return;
        }

        // Header
        console.log(
            chalk.bold('  SERVER'.padEnd(20)) +
            chalk.bold('NODES'.padEnd(10)) +
            chalk.bold('STATUS'.padEnd(15)) +
            chalk.bold('DESCRIPTION')
        );
        console.log(chalk.dim('  ' + '─'.repeat(70)));

        let count = 0;

        for (const file of files) {
            try {
                const content = readFileSync(join(workflowsDir, file), 'utf-8');
                const def = file.endsWith('.json')
                    ? JSON.parse(content)
                    : yaml.parse(content);

                const validation = validateWorkflow(def as WorkflowDefinition);

                const name = (def.name || basename(file, '.yaml')).padEnd(20);
                const nodes = String(def.nodes?.length || 0).padEnd(10);
                const statusStr = validation.valid ? '✓ Valid' : '✗ Invalid';
                const statusColor = validation.valid ? chalk.green : chalk.red;
                const status = statusColor(statusStr).padEnd(15 + (statusColor('x').length - 1)); // adjust for ansi codes length
                // Simpler padding approach for color:
                const statusDisplay = validation.valid ? chalk.green('✓ Valid  ') : chalk.red('✗ Invalid');

                const desc = chalk.dim((def.description || '-').substring(0, 40));

                // Manual padding alignment
                process.stdout.write(`  ${name}${nodes}${statusDisplay}   ${desc}\n`);
                count++;
            } catch (error) {
                console.log(`  ${chalk.red(basename(file).padEnd(20))} Error loading file`);
            }
        }

        console.log('\n' + chalk.dim(`  Total: ${count} workflow(s)`));
    });

// ============================================================================
// Run Workflow
// ============================================================================

workflowCommand
    .command('run <name>')
    .description('Executar um workflow')
    .option('-i, --input <json>', 'JSON de entrada para o workflow')
    .option('-w, --watch', 'Acompanhar execução em tempo real')
    .option('-v, --verbose', 'Mostrar detalhes de execução')
    .action(async (name, options) => {
        const spinner = logger.spin(`Carregando workflow "${name}"...`);

        try {
            const configManager = getConfigManager();
            if (!configManager.isInitialized()) {
                spinner.fail('PAGIA não foi inicializado.');
                return;
            }

            const workflowsDir = join(configManager.getPagiaFolder(), 'workflows');
            const workflowFile = findWorkflowFile(workflowsDir, name);

            if (!workflowFile) {
                spinner.fail(`Workflow "${name}" não encontrado.`);
                logger.info(`Workflows disponíveis em: ${workflowsDir}`);
                return;
            }

            // Carregar e validar
            const content = readFileSync(workflowFile, 'utf-8');
            const workflow = workflowFile.endsWith('.json')
                ? JSON.parse(content)
                : yaml.parse(content);

            const validation = validateWorkflow(workflow);
            if (!validation.valid) {
                spinner.fail('Workflow inválido.');
                for (const error of validation.errors) {
                    logger.error(`  ${error.code}: ${error.message}`);
                }
                return;
            }

            spinner.text = 'Workflow válido. Iniciando execução...';

            // Preparar input
            const input = {
                prompt: options.input ? JSON.parse(options.input).prompt || '' : '',
                context: options.input ? JSON.parse(options.input) : {},
            };

            // Configurar listeners se --watch
            const unsubscribers: Array<() => void> = [];
            if (options.watch || options.verbose) {
                unsubscribers.push(
                    eventBus.on(PAGIAEvents.WORKFLOW_NODE_STARTED, (event: any) => {
                        console.log(chalk.cyan(`  ▶ Iniciando: ${event.nodeId}`));
                    })
                );
                unsubscribers.push(
                    eventBus.on(PAGIAEvents.WORKFLOW_NODE_COMPLETED, (event: any) => {
                        const duration = event.result?.durationMs || 0;
                        console.log(chalk.green(`  ✓ Completo: ${event.nodeId} (${duration}ms)`));
                    })
                );
                unsubscribers.push(
                    eventBus.on(PAGIAEvents.WORKFLOW_NODE_FAILED, (event: any) => {
                        console.log(chalk.red(`  ✗ Falhou: ${event.nodeId} - ${event.error?.message}`));
                    })
                );
                unsubscribers.push(
                    eventBus.on(PAGIAEvents.WORKFLOW_NODE_RETRY, (event: any) => {
                        console.log(chalk.yellow(`  ↻ Retry: ${event.nodeId} (tentativa ${event.attempt}/${event.maxAttempts})`));
                    })
                );
            }

            spinner.stop();
            console.log(chalk.bold(`\n🚀 Executando workflow: ${workflow.name}\n`));

            const startTime = Date.now();
            const result = await workflowEngine.execute(workflow, input);
            const duration = Date.now() - startTime;

            // Limpar listeners
            unsubscribers.forEach(unsub => unsub());

            // Exibir resultado
            console.log('\n' + chalk.bold('─'.repeat(60)));

            if (result.status === 'completed') {
                console.log(chalk.green.bold(`\n✓ Workflow completado com sucesso!`));
            } else {
                console.log(chalk.red.bold(`\n✗ Workflow ${result.status}`));
                if (result.error) {
                    console.log(chalk.red(`  Erro: ${result.error.message}`));
                }
            }

            // Métricas
            console.log(chalk.dim(`\n📊 Métricas:`));
            console.log(`  Tempo total: ${result.metrics.totalDurationMs}ms`);
            console.log(`  Nodos: ${result.metrics.successfulNodes}/${result.metrics.totalNodes} sucesso`);
            if (result.metrics.totalTokensUsed > 0) {
                console.log(`  Tokens: ${result.metrics.totalTokensUsed}`);
            }
            if (result.metrics.parallelismSavingsMs && result.metrics.parallelismSavingsMs > 0) {
                console.log(`  Economia por paralelismo: ~${result.metrics.parallelismSavingsMs}ms`);
            }

            // Output
            if (options.verbose && result.output) {
                console.log(chalk.dim(`\n📄 Output:`));
                console.log(result.output.content.substring(0, 500) + '...');
            }

        } catch (error) {
            spinner.fail(`Erro ao executar workflow: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

// ============================================================================
// Visualize Workflow
// ============================================================================

workflowCommand
    .command('visualize <name>')
    .description('Visualizar estrutura do workflow em ASCII')
    .action(async (name) => {
        const configManager = getConfigManager();
        if (!configManager.isInitialized()) {
            logger.warn('PAGIA não foi inicializado.');
            return;
        }

        const workflowsDir = join(configManager.getPagiaFolder(), 'workflows');
        const workflowFile = findWorkflowFile(workflowsDir, name);

        if (!workflowFile) {
            logger.error(`Workflow "${name}" não encontrado.`);
            return;
        }

        const content = readFileSync(workflowFile, 'utf-8');
        const workflow: WorkflowDefinition = workflowFile.endsWith('.json')
            ? JSON.parse(content)
            : yaml.parse(content);

        console.log(chalk.bold(`\n📊 Workflow: ${workflow.name}\n`));
        if (workflow.description) {
            console.log(chalk.dim(workflow.description) + '\n');
        }

        // Construir visualização ASCII
        const ascii = buildAsciiDAG(workflow);
        console.log(ascii);

        // Mostrar configuração
        console.log(chalk.dim('\n⚙️  Configuração:'));
        console.log(`  Max Concurrency: ${workflow.config.maxConcurrency}`);
        if (workflow.config.timeout) {
            console.log(`  Timeout: ${workflow.config.timeout}ms`);
        }
        console.log(`  Fail Fast: ${workflow.config.failFast ?? false}`);
    });

// ============================================================================
// Validate Workflow
// ============================================================================

workflowCommand
    .command('validate <name>')
    .description('Validar definição de workflow')
    .action(async (name) => {
        const configManager = getConfigManager();
        if (!configManager.isInitialized()) {
            logger.warn('PAGIA não foi inicializado.');
            process.exit(1);
        }

        const workflowsDir = join(configManager.getPagiaFolder(), 'workflows');
        const workflowFile = findWorkflowFile(workflowsDir, name);

        if (!workflowFile) {
            logger.error(`Workflow "${name}" não encontrado.`);
            process.exit(1);
        }

        try {
            const content = readFileSync(workflowFile, 'utf-8');
            const workflow: WorkflowDefinition = workflowFile.endsWith('.json')
                ? JSON.parse(content)
                : yaml.parse(content);

            const validation = validateWorkflow(workflow);

            if (validation.valid) {
                console.log(chalk.green.bold(`\n✓ Workflow "${name}" é válido!\n`));

                if (validation.warnings.length > 0) {
                    console.log(chalk.yellow('⚠️  Warnings:'));
                    for (const warning of validation.warnings) {
                        console.log(chalk.yellow(`  - ${warning.code}: ${warning.message}`));
                    }
                }

                // Stats
                console.log(chalk.dim('📊 Estatísticas:'));
                console.log(`  Nodos: ${workflow.nodes.length}`);
                console.log(`  Arestas: ${workflow.edges.length}`);

                process.exit(0);
            } else {
                console.log(chalk.red.bold(`\n✗ Workflow "${name}" é inválido!\n`));

                console.log(chalk.red('Erros:'));
                for (const error of validation.errors) {
                    console.log(chalk.red(`  - ${error.code}: ${error.message}`));
                }

                if (validation.warnings.length > 0) {
                    console.log(chalk.yellow('\nWarnings:'));
                    for (const warning of validation.warnings) {
                        console.log(chalk.yellow(`  - ${warning.code}: ${warning.message}`));
                    }
                }

                process.exit(1);
            }
        } catch (error) {
            logger.error(`Erro ao validar: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
    });

// ============================================================================
// Create Workflow
// ============================================================================

workflowCommand
    .command('create <name>')
    .description('Criar um novo workflow a partir de template')
    .option('-t, --type <type>', 'Tipo: linear, parallel, fan-out-in', 'linear')
    .action(async (name, options) => {
        const configManager = getConfigManager();
        if (!configManager.isInitialized()) {
            logger.warn('PAGIA não foi inicializado.');
            return;
        }

        const workflowsDir = join(configManager.getPagiaFolder(), 'workflows');

        // Criar diretório se não existir
        if (!existsSync(workflowsDir)) {
            mkdirSync(workflowsDir, { recursive: true });
        }

        const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}.yaml`;
        const filePath = join(workflowsDir, fileName);

        if (existsSync(filePath)) {
            logger.warn(`Workflow "${name}" já existe em ${filePath}`);
            return;
        }

        // Gerar template
        const template = generateWorkflowTemplate(name, options.type);
        writeFileSync(filePath, template, 'utf-8');

        logger.success(`Workflow criado: ${filePath}`);
        logger.info(`Edite o arquivo para configurar nodos e arestas.`);
    });

// ============================================================================
// Import Workflow (n8n, etc)
// ============================================================================

workflowCommand
    .command('import <file>')
    .description('Importar workflow de outras plataformas (ex: n8n)')
    .option('-t, --type <type>', 'Tipo de origem: n8n', 'n8n')
    .action(async (file, options) => {
        const configManager = getConfigManager();
        if (!configManager.isInitialized()) {
            logger.warn('PAGIA não foi inicializado.');
            return;
        }

        const workflowsDir = join(configManager.getPagiaFolder(), 'workflows');

        if (!existsSync(file)) {
            logger.error(`Arquivo não encontrado: ${file}`);
            return;
        }

        try {
            const content = readFileSync(file, 'utf-8');
            let json;
            try {
                json = JSON.parse(content);
            } catch {
                logger.error('O arquivo deve ser um JSON válido.');
                return;
            }

            let pagiaWorkflow;
            const format = options.type || detectFormat(json); // Detecta automaticamente se não especificado
            logger.info(`Formato detectado: ${format}`);

            if (format === 'n8n') {
                const name = basename(file, '.json').toLowerCase().replace(/\s+/g, '-');
                pagiaWorkflow = convertN8nToPagia(name, json);

                const outputFile = join(workflowsDir, `${name}-imported.yaml`);
                writeFileSync(outputFile, pagiaWorkflow, 'utf-8');
                logger.success(`Workflow n8n importado com sucesso: ${outputFile}`);
            } else if (format === 'node-red') {
                const name = basename(file, '.json').toLowerCase().replace(/\s+/g, '-');
                pagiaWorkflow = convertNodeRedToPagia(name, json);

                const outputFile = join(workflowsDir, `${name}-imported.yaml`);
                writeFileSync(outputFile, pagiaWorkflow, 'utf-8');
                logger.success(`Workflow Node-RED importado com sucesso: ${outputFile}`);
            } else {
                logger.error(`Formato desconhecido ou não suportado (apenas n8n e node-red detectados). Use --type se necessário.`);
                return;
            }

            logger.info('💡 Dica: Abra o "pagia workflow editor" para ajustar os agentes de cada nodo.');

        } catch (error) {
            logger.error(`Erro na importação: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

// ============================================================================
// Helper Functions
// ============================================================================

// function convertN8nToPagia moved to ../utils/workflow-converter.ts


function findWorkflowFile(dir: string, name: string): string | null {
    if (!existsSync(dir)) return null;

    // Tentar extensões comuns
    const extensions = ['.yaml', '.yml', '.json'];
    const baseName = name.toLowerCase().replace(/\s+/g, '-');

    for (const ext of extensions) {
        const filePath = join(dir, baseName + ext);
        if (existsSync(filePath)) {
            return filePath;
        }
    }

    // Tentar nome exato
    const exactPath = join(dir, name);
    if (existsSync(exactPath)) {
        return exactPath;
    }

    return null;
}

function buildAsciiDAG(workflow: WorkflowDefinition): string {
    const lines: string[] = [];

    // Agrupar nodos por nível
    const levels = calculateLevels(workflow);

    lines.push('┌─────────────┐');
    lines.push('│   START     │');
    lines.push('└──────┬──────┘');
    lines.push('       │');

    for (let i = 0; i < levels.length; i++) {
        const level = levels[i];

        if (level.length === 1) {
            // Nodo único
            const node = level[0];
            const nodeBox = formatNodeBox(node);
            lines.push(...nodeBox);
        } else {
            // Múltiplos nodos (paralelos)
            lines.push('       │');
            lines.push('┌──────┴──────┐');

            const parallelLines = level.map(n => `│ ${n.padEnd(11)} │`);
            lines.push(parallelLines.join('  '));

            lines.push('└──────┬──────┘');
        }

        if (i < levels.length - 1) {
            lines.push('       │');
            lines.push('       ▼');
        }
    }

    lines.push('       │');
    lines.push('       ▼');
    lines.push('┌─────────────┐');
    lines.push('│     END     │');
    lines.push('└─────────────┘');

    return lines.join('\n');
}

function calculateLevels(workflow: WorkflowDefinition): string[][] {
    // Simplificação: ordenar por dependências
    const levels: string[][] = [];
    const processed = new Set<string>();
    const nodeIds = workflow.nodes.map(n => n.id);

    // Encontrar nodos iniciais (conectados a __start__)
    const startEdges = workflow.edges.filter(e => e.from === START_NODE_ID);
    const firstLevel = startEdges.map(e => e.to).filter(id => id !== END_NODE_ID);

    if (firstLevel.length > 0) {
        levels.push(firstLevel);
        firstLevel.forEach(id => processed.add(id));
    }

    // Adicionar níveis subsequentes
    let maxIterations = nodeIds.length;
    while (processed.size < nodeIds.length && maxIterations > 0) {
        const currentLevel: string[] = [];

        for (const nodeId of nodeIds) {
            if (processed.has(nodeId)) continue;

            // Verificar se todas as dependências foram processadas
            const deps = workflow.edges
                .filter(e => e.to === nodeId)
                .map(e => e.from)
                .filter(id => id !== START_NODE_ID);

            const allDepsProcessed = deps.every(d => processed.has(d));
            if (allDepsProcessed) {
                currentLevel.push(nodeId);
            }
        }

        if (currentLevel.length > 0) {
            levels.push(currentLevel);
            currentLevel.forEach(id => processed.add(id));
        }

        maxIterations--;
    }

    return levels;
}

function formatNodeBox(nodeId: string): string[] {
    const displayName = nodeId.length > 11 ? nodeId.substring(0, 8) + '...' : nodeId;
    return [
        '       │',
        '       ▼',
        '┌─────────────┐',
        `│ ${displayName.padEnd(11)} │`,
        '└──────┬──────┘',
    ];
}

function generateWorkflowTemplate(name: string, type: string): string {
    const id = name.toLowerCase().replace(/\s+/g, '-');

    const templates: Record<string, string> = {
        linear: `# Workflow: ${name}
# Tipo: Linear (A → B → C)

id: ${id}
name: ${name}
description: Workflow linear sequencial

config:
  maxConcurrency: 1
  timeout: 300000
  failFast: true

nodes:
  - id: step-1
    name: Primeiro Passo
    agentId: analyst  # Substitua pelo ID do agente

  - id: step-2
    name: Segundo Passo
    agentId: planner  # Substitua pelo ID do agente

  - id: step-3
    name: Terceiro Passo
    agentId: developer  # Substitua pelo ID do agente

edges:
  - from: __start__
    to: step-1
  - from: step-1
    to: step-2
  - from: step-2
    to: step-3
  - from: step-3
    to: __end__
`,
        parallel: `# Workflow: ${name}
# Tipo: Paralelo (__start__ → [A, B, C] → __end__)

id: ${id}
name: ${name}
description: Workflow com execução paralela

config:
  maxConcurrency: 5
  timeout: 300000
  failFast: false

nodes:
  - id: task-a
    name: Tarefa A
    agentId: agent-a  # Substitua pelo ID do agente

  - id: task-b
    name: Tarefa B
    agentId: agent-b  # Substitua pelo ID do agente

  - id: task-c
    name: Tarefa C
    agentId: agent-c  # Substitua pelo ID do agente

edges:
  - from: __start__
    to: task-a
  - from: __start__
    to: task-b
  - from: __start__
    to: task-c
  - from: task-a
    to: __end__
  - from: task-b
    to: __end__
  - from: task-c
    to: __end__
`,
        'fan-out-in': `# Workflow: ${name}
# Tipo: Fan-out/Fan-in (A → [B, C] → D)

id: ${id}
name: ${name}
description: Workflow com ramificação e junção

config:
  maxConcurrency: 3
  timeout: 300000
  failFast: false

nodes:
  - id: prepare
    name: Preparação
    agentId: planner  # Substitua pelo ID do agente

  - id: branch-1
    name: Ramo 1
    agentId: developer  # Substitua pelo ID do agente

  - id: branch-2
    name: Ramo 2
    agentId: tester  # Substitua pelo ID do agente

  - id: merge
    name: Consolidação
    agentId: reviewer  # Substitua pelo ID do agente

edges:
  - from: __start__
    to: prepare
  - from: prepare
    to: branch-1
  - from: prepare
    to: branch-2
  - from: branch-1
    to: merge
  - from: branch-2
    to: merge
  - from: merge
    to: __end__
`,
    };

    return templates[type] || templates.linear;
}

// ============================================================================
// API Server Command
// ============================================================================

workflowCommand
    .command('api')
    .description('Iniciar servidor de API REST para workflows')
    .option('-p, --port <port>', 'Porta do servidor', '3001')
    .action(async (options) => {
        const port = parseInt(options.port, 10);

        logger.section('Workflow API Server');

        try {
            // Import dinâmico para evitar carregar Express quando não necessário
            const { startWorkflowServer } = await import('../api/workflow-server.js');
            await startWorkflowServer(port);

            logger.info('Pressione Ctrl+C para parar o servidor.');
        } catch (error) {
            logger.error(`Erro ao iniciar servidor: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

// ============================================================================
// Editor Command (abre o editor visual)
// ============================================================================

workflowCommand
    .command('editor')
    .description('Iniciar editor visual de DAG')
    .option('-p, --port <port>', 'Porta do servidor', '3001')
    .action(async (options) => {
        const port = parseInt(options.port, 10);

        logger.section('Workflow Editor');

        try {
            const { startWorkflowServer } = await import('../api/workflow-server.js');
            await startWorkflowServer(port);

            console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║                    🎨 PAGIA DAG Editor                        ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Editor rodando em:                                           ║
║  ${chalk.green(`http://localhost:${port}`)}                                  ║
║                                                               ║
║  API disponível em:                                           ║
║  ${chalk.blue(`http://localhost:${port}/api`)}                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`));

            // Tentar abrir no navegador
            try {
                const open = (await import('open')).default;
                await open(`http://localhost:${port}`);
            } catch {
                // Ignore se não conseguir abrir
            }

            logger.info('Pressione Ctrl+C para parar.');
        } catch (error) {
            logger.error(`Erro ao iniciar editor: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

#!/usr/bin/env node
/**
 * PAGIA - Plano de Ação de Gestão e Implementação com IA
 * CLI Principal Premium
 * 
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */

import { Command } from 'commander';
import { config } from 'dotenv';
import { logger } from './utils/logger.js';

// Commands
import { initCommand } from './commands/init.js';
import { installCommand } from './commands/install.js';
import { statusCommand } from './commands/status.js';
import { planCommand } from './commands/plan.js';
import { agentCommand } from './commands/agent.js';
import { updateCommand } from './commands/update.js';
import { configCommand } from './commands/config.js';
import { bundleCommand } from './commands/bundle.js';
import { knowledgeCommand } from './commands/knowledge.js';
import { mcpCommand } from './commands/mcp.js';
import { tddCommand } from './commands/tdd.js';
import { registryCommand } from './commands/registry.js';
import { conductorCommand } from './commands/conductor.js';
import { doctorCommand } from './commands/doctor.js';
import { pluginCommand } from './commands/plugin.js';
import { skillCommand } from './commands/skill.js';

// Load environment variables
config();

// Windows fix: Prevent UV_HANDLE_CLOSING assertion crash
if (process.platform === 'win32') {
    const originalExit = process.exit;
    (process.exit as any) = (code?: number) => {
        process.stdout.write('', () => {
            process.stderr.write('', () => {
                setTimeout(() => originalExit(code), 50);
            });
        });
    };

    process.on('uncaughtException', (err) => {
        if (err.message && (err.message.includes('UV_HANDLE') || err.message.includes('flags & UV_HANDLE_CLOSING'))) {
            originalExit(0);
        }
        console.error('Uncaught exception:', err);
        originalExit(1);
    });
}

const VERSION: string = '1.0.0';
const LATEST_VERSION: string = '1.0.5'; // Simulation for update notice

const program = new Command();

// Show Premium Banner and Welcome
function showWelcome(): void {
    logger.welcome(VERSION, process.cwd());

    // Show update notice if simulated version is newer
    if (VERSION !== LATEST_VERSION) {
        logger.updateNotice(VERSION, LATEST_VERSION, [
            'Estética e layout da CLI aprimorados',
            'Sessões de chat persistentes com agentes',
            'Nova integração de ferramentas MCP para agentes',
            'Correção de problemas de compatibilidade com terminal Windows'
        ]);
    }

    logger.banner();

    logger.tips([
        'Faça perguntas, edite arquivos ou execute comandos.',
        'Use \`pagia agent run analyst\` para iniciar uma análise de projeto.',
        'Crie um projeto com \`pagia init\` e gerencie tarefas com \`pagia plan\`.',
        'Digite \`pagia help\` para mais informações.',
        'Modo inteligente ativado por padrão.'
    ]);
}

// Main CLI setup
program
    .name('pagia')
    .description('PAGIA - Plano de Ação de Gestão e Implementação com IA')
    .version(VERSION)
    .hook('preAction', (thisCommand) => {
        // Only show welcome if it's the main command or agent run/list
        if (thisCommand.name() === 'pagia' || ['run', 'list', 'agent'].includes(thisCommand.name())) {
            showWelcome();
        }
    });

// Register core commands
program.addCommand(initCommand);
program.addCommand(installCommand);
program.addCommand(statusCommand);
program.addCommand(configCommand);

// Register plan commands
program.addCommand(planCommand);
program.addCommand(agentCommand);
program.addCommand(updateCommand);

// Register advanced commands
program.addCommand(bundleCommand);
program.addCommand(knowledgeCommand);
program.addCommand(mcpCommand);
program.addCommand(tddCommand);
program.addCommand(registryCommand);
program.addCommand(conductorCommand);
program.addCommand(doctorCommand);
program.addCommand(pluginCommand);
program.addCommand(skillCommand);

// Parse arguments
program.parse(process.argv);

// If no command provided, show help
if (!process.argv.slice(2).length) {
    showWelcome();
    program.outputHelp();
}



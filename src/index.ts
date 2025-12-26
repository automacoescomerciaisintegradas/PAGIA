#!/usr/bin/env node
/**
 * PAGIA - Plano de Ação de Gestão e Implementação com IA
 * CLI Principal
 * 
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */

import { Command } from 'commander';
import figlet from 'figlet';
import chalk from 'chalk';
import { config } from 'dotenv';

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

// Load environment variables
config();

// Windows fix: Prevent UV_HANDLE_CLOSING assertion crash
// This is a known issue with Node.js on Windows when using certain terminal features
if (process.platform === 'win32') {
    process.on('exit', () => {
        // Ensure clean exit on Windows
    });

    // Suppress uncaught exceptions related to UV_HANDLE
    process.on('uncaughtException', (err) => {
        if (err.message && err.message.includes('UV_HANDLE')) {
            // Ignore UV_HANDLE errors on Windows
            process.exit(0);
        }
        console.error('Uncaught exception:', err);
        process.exit(1);
    });
}

const program = new Command();

// ASCII Art Banner
function showBanner(): void {
    console.log(
        chalk.cyan(
            figlet.textSync('PAGIA', {
                font: 'ANSI Shadow',
                horizontalLayout: 'default',
            })
        )
    );
    console.log(
        chalk.gray('  Plano de Ação de Gestão e Implementação com IA')
    );
    console.log(
        chalk.gray('  © 2025 Automações Comerciais Integradas\n')
    );
}

// Main CLI setup
program
    .name('pagia')
    .description('PAGIA - Plano de Ação de Gestão e Implementação com IA')
    .version('1.0.0')
    .hook('preAction', () => {
        showBanner();
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

// Parse arguments
program.parse(process.argv);

// If no command provided, show help
if (!process.argv.slice(2).length) {
    showBanner();
    program.outputHelp();
}


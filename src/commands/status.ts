/**
 * PAGIA - Status Command
 * Exibir status do projeto PAGIA
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { getConfigManager } from '../core/config-manager.js';
import { logger } from '../utils/logger.js';

export const statusCommand = new Command('status')
    .description('Exibir status do PAGIA no projeto')
    .option('-v, --verbose', 'Modo verboso com detalhes')
    .action(async (options) => {
        const configManager = getConfigManager();

        // Check if PAGIA is initialized
        if (!configManager.isInitialized()) {
            logger.box(
                `${chalk.yellow('PAGIA não está inicializado neste projeto.')}\n\n` +
                `Execute ${chalk.cyan('pagia init')} para começar.`,
                { title: '⚠️ Status', borderColor: 'yellow' }
            );
            return;
        }

        const config = configManager.load()!;
        const pagiaFolder = configManager.getPagiaFolder();

        // Header
        logger.section('Status do PAGIA');

        // Basic info
        console.log(chalk.bold('📁 Configuração'));
        logger.keyValue('Pasta PAGIA', pagiaFolder);
        logger.keyValue('Usuário', config.userName);
        logger.keyValue('Idioma', config.language);
        logger.keyValue('Debug', config.debug ? 'Ativado' : 'Desativado');
        logger.newLine();

        // AI Provider
        console.log(chalk.bold('🤖 Provedor de IA'));
        logger.keyValue('Provedor', config.aiProvider.type);
        logger.keyValue('Modelo', config.aiProvider.model);
        logger.keyValue('API Key', config.aiProvider.apiKey ? '********' + config.aiProvider.apiKey.slice(-4) : 'Não configurada');
        logger.newLine();

        // Modules
        console.log(chalk.bold('📦 Módulos'));
        const enabledModules = config.modules.filter((m) => m.enabled);
        const disabledModules = config.modules.filter((m) => !m.enabled);

        enabledModules.forEach((m) => {
            console.log(`  ${chalk.green('✓')} ${m.name} ${chalk.gray(`(${m.code})`)}`);
        });

        disabledModules.forEach((m) => {
            console.log(`  ${chalk.gray('○')} ${m.name} ${chalk.gray(`(${m.code})`)}`);
        });
        logger.newLine();

        // Plans summary
        if (options.verbose) {
            console.log(chalk.bold('📊 Planos'));

            const plansFolder = join(pagiaFolder, 'plans');
            if (existsSync(plansFolder)) {
                const planTypes = ['global', 'stages', 'prompts', 'ai'];

                for (const type of planTypes) {
                    const typeFolder = join(plansFolder, type);
                    if (existsSync(typeFolder)) {
                        const files = readdirSync(typeFolder).filter(f => f.endsWith('.yaml') || f.endsWith('.json'));
                        logger.keyValue(type.charAt(0).toUpperCase() + type.slice(1), `${files.length} plano(s)`);
                    }
                }
            } else {
                logger.info('Nenhum plano criado ainda');
            }
            logger.newLine();

            // Agents summary
            console.log(chalk.bold('🤖 Agentes'));
            let totalAgents = 0;

            for (const module of enabledModules) {
                const agentsFolder = join(pagiaFolder, 'modules', module.code, 'agents');
                if (existsSync(agentsFolder)) {
                    const agents = readdirSync(agentsFolder).filter(f => f.endsWith('.md'));
                    totalAgents += agents.length;
                    if (agents.length > 0) {
                        logger.keyValue(module.name, `${agents.length} agente(s)`);
                    }
                }
            }

            // Core agents
            const coreAgentsFolder = join(pagiaFolder, 'core', 'agents');
            if (existsSync(coreAgentsFolder)) {
                const coreAgents = readdirSync(coreAgentsFolder).filter(f => f.endsWith('.md'));
                if (coreAgents.length > 0) {
                    totalAgents += coreAgents.length;
                    logger.keyValue('Core', `${coreAgents.length} agente(s)`);
                }
            }

            if (totalAgents === 0) {
                logger.info('Nenhum agente configurado ainda');
            }
            logger.newLine();

            // Disk usage
            console.log(chalk.bold('💾 Uso de Disco'));
            const folderSize = getFolderSize(pagiaFolder);
            logger.keyValue('Tamanho total', formatBytes(folderSize));
        }

        // Quick actions
        logger.newLine();
        logger.box(
            `${chalk.bold('Ações Rápidas')}\n\n` +
            `${chalk.cyan('pagia plan create')} - Criar novo plano\n` +
            `${chalk.cyan('pagia update todos')} - Atualizar tarefas\n` +
            `${chalk.cyan('pagia agent list')} - Listar agentes`,
            { title: '💡 Dicas', borderColor: 'cyan' }
        );
    });

function getFolderSize(folderPath: string): number {
    let totalSize = 0;

    if (!existsSync(folderPath)) {
        return 0;
    }

    const files = readdirSync(folderPath);

    for (const file of files) {
        const filePath = join(folderPath, file);
        const stats = statSync(filePath);

        if (stats.isDirectory()) {
            totalSize += getFolderSize(filePath);
        } else {
            totalSize += stats.size;
        }
    }

    return totalSize;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

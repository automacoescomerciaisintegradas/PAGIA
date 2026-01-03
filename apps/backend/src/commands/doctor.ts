/**
 * PAGIA - Doctor Command
 * Verificação de pré-requisitos e diagnóstico do sistema
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger.js';
import { getConfigManager } from '../core/config-manager.js';

interface CheckResult {
    name: string;
    status: 'ok' | 'warn' | 'error';
    message: string;
    fix?: string;
}

export const doctorCommand = new Command('doctor')
    .description('Verificar pré-requisitos e diagnóstico do sistema')
    .option('-v, --verbose', 'Mostrar detalhes completos')
    .action(async (options) => {
        logger.section('PAGIA Doctor - Diagnóstico do Sistema');

        const checks: CheckResult[] = [];

        // 1. Verificar Node.js
        try {
            const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
            const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);

            if (majorVersion >= 18) {
                checks.push({
                    name: 'Node.js',
                    status: 'ok',
                    message: `${nodeVersion} (mínimo: v18)`
                });
            } else {
                checks.push({
                    name: 'Node.js',
                    status: 'error',
                    message: `${nodeVersion} (requer v18 ou superior)`,
                    fix: 'Atualize o Node.js: https://nodejs.org'
                });
            }
        } catch {
            checks.push({
                name: 'Node.js',
                status: 'error',
                message: 'Não encontrado',
                fix: 'Instale o Node.js: https://nodejs.org'
            });
        }

        // 2. Verificar npm
        try {
            const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
            checks.push({
                name: 'npm',
                status: 'ok',
                message: `v${npmVersion}`
            });
        } catch {
            checks.push({
                name: 'npm',
                status: 'error',
                message: 'Não encontrado',
                fix: 'npm vem com o Node.js'
            });
        }

        // 3. Verificar Git
        try {
            const gitVersion = execSync('git --version', { encoding: 'utf-8' }).trim();
            checks.push({
                name: 'Git',
                status: 'ok',
                message: gitVersion.replace('git version ', '')
            });
        } catch {
            checks.push({
                name: 'Git',
                status: 'warn',
                message: 'Não encontrado (opcional)',
                fix: 'Instale o Git: https://git-scm.com'
            });
        }

        // 4. Verificar variáveis de ambiente (API Keys)
        const apiKeys = [
            { name: 'GROQ_API_KEY', provider: 'Groq' },
            { name: 'GEMINI_API_KEY', provider: 'Google Gemini' },
            { name: 'OPENAI_API_KEY', provider: 'OpenAI' },
            { name: 'ANTHROPIC_API_KEY', provider: 'Anthropic' },
        ];

        let hasApiKey = false;
        for (const key of apiKeys) {
            if (process.env[key.name]) {
                hasApiKey = true;
                checks.push({
                    name: `API Key (${key.provider})`,
                    status: 'ok',
                    message: `${key.name} configurado`
                });
                break; // Só precisa de uma
            }
        }

        if (!hasApiKey) {
            checks.push({
                name: 'API Key',
                status: 'error',
                message: 'Nenhuma API key de IA configurada',
                fix: 'Configure GROQ_API_KEY, GEMINI_API_KEY ou OPENAI_API_KEY no .env'
            });
        }

        // 5. Verificar AI_PROVIDER
        const aiProvider = process.env.AI_PROVIDER;
        if (aiProvider) {
            checks.push({
                name: 'AI_PROVIDER',
                status: 'ok',
                message: aiProvider
            });
        } else {
            checks.push({
                name: 'AI_PROVIDER',
                status: 'warn',
                message: 'Não definido (será detectado automaticamente)',
                fix: 'Opcional: defina AI_PROVIDER=groq no .env'
            });
        }

        // 6. Verificar inicialização do PAGIA
        const configManager = getConfigManager();
        if (configManager.isInitialized()) {
            const config = configManager.load();
            checks.push({
                name: 'PAGIA Inicializado',
                status: 'ok',
                message: `Projeto: ${config?.userName || 'N/A'}`
            });
        } else {
            checks.push({
                name: 'PAGIA Inicializado',
                status: 'warn',
                message: 'Projeto não inicializado (opcional para agentes embutidos)',
                fix: 'Execute: pagia init'
            });
        }

        // 7. Verificar agentes embutidos
        const bundledAgentsPath = getBundledAgentsPath();
        if (bundledAgentsPath && existsSync(bundledAgentsPath)) {
            const agentCount = countAgents(bundledAgentsPath);
            checks.push({
                name: 'Agentes Embutidos',
                status: 'ok',
                message: `${agentCount} agentes disponíveis`
            });
        } else {
            checks.push({
                name: 'Agentes Embutidos',
                status: 'error',
                message: 'Pasta de agentes não encontrada',
                fix: 'Reinstale o PAGIA: npm link'
            });
        }

        // 8. Verificar MCP Server
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch('http://localhost:3100/health', {
                method: 'GET',
                timeout: 2000
            } as any);
            if (response.ok) {
                checks.push({
                    name: 'MCP Server',
                    status: 'ok',
                    message: 'Rodando em localhost:3100'
                });
            }
        } catch {
            checks.push({
                name: 'MCP Server',
                status: 'warn',
                message: 'Não está rodando (opcional)',
                fix: 'Execute: pagia mcp start -p 3100'
            });
        }

        // Exibir resultados
        logger.newLine();

        let hasErrors = false;
        let hasWarnings = false;

        for (const check of checks) {
            const icon = check.status === 'ok' ? chalk.green('✓') :
                check.status === 'warn' ? chalk.yellow('⚠') :
                    chalk.red('✗');

            const statusColor = check.status === 'ok' ? chalk.green :
                check.status === 'warn' ? chalk.yellow :
                    chalk.red;

            console.log(`${icon} ${chalk.bold(check.name)}: ${statusColor(check.message)}`);

            if (check.fix && options.verbose) {
                console.log(`  ${chalk.gray('→ Fix:')} ${chalk.cyan(check.fix)}`);
            }

            if (check.status === 'error') hasErrors = true;
            if (check.status === 'warn') hasWarnings = true;
        }

        logger.newLine();

        // Resumo
        if (hasErrors) {
            logger.error('Alguns problemas precisam ser resolvidos.');
            logger.info('Execute `pagia doctor -v` para ver as soluções.');
        } else if (hasWarnings) {
            logger.warn('Sistema funcional com alguns avisos.');
        } else {
            logger.success('Todos os pré-requisitos estão OK! 🎉');
        }

        // Mostrar versão do PAGIA
        logger.newLine();
        logger.keyValue('PAGIA Version', '1.0.0');
        logger.keyValue('Plataforma', `${process.platform} ${process.arch}`);
    });

function getBundledAgentsPath(): string | null {
    try {
        const currentFileUrl = import.meta.url;
        const currentFilePath = new URL(currentFileUrl).pathname;
        const normalizedPath = process.platform === 'win32'
            ? currentFilePath.slice(1)
            : currentFilePath;

        const packageRoot = join(normalizedPath, '..', '..', '..');
        const bundledPath = join(packageRoot, '.pagia', 'core', 'agents');

        if (existsSync(bundledPath)) {
            return bundledPath;
        }
        return null;
    } catch {
        return null;
    }
}

function countAgents(path: string): number {
    try {
        const { readdirSync } = require('fs');
        return readdirSync(path).filter((f: string) => f.endsWith('.md')).length;
    } catch {
        return 0;
    }
}

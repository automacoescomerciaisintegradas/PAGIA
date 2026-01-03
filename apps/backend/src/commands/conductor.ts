/**
 * PAGIA - Conductor Command
 * Desenvolvimento Orientado por Contexto
 * 
 * @module commands/conductor
 * @author Automações Comerciais Integradas
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { join } from 'path';
import { getConfigManager } from '../core/config-manager.js';
import { conductorAgent } from '../agents/specialized/conductor-agent.js';
import { agentRegistry } from '../agents/agent-registry.js';
import { logger } from '../utils/logger.js';

export const conductorCommand = new Command('conductor')
    .alias('cdr')
    .description('Desenvolvimento Orientado por Contexto (Context-Driven Development)');

// Setup do projeto
conductorCommand
    .command('setup')
    .description('Configurar contexto do projeto')
    .action(async () => {
        const configManager = getConfigManager();

        // Registrar agente
        if (!agentRegistry.has(conductorAgent.id)) {
            await agentRegistry.register(conductorAgent, ['conductor', 'context']);
        }

        logger.box(
            `${chalk.bold('🎭 Conductor - Context-Driven Development')}\n\n` +
            'O Conductor transforma seu projeto em uma fonte única de verdade.\n\n' +
            'Este setup vai criar:\n' +
            '• product.md - Definição do produto\n' +
            '• product-guidelines.md - Guidelines de marca\n' +
            '• tech-stack.md - Stack técnica\n' +
            '• workflow.md - Processos de trabalho',
            { title: '🎼 Setup', borderColor: 'magenta' }
        );

        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Iniciar configuração do Conductor?',
                default: true,
            },
        ]);

        if (!confirm) {
            logger.info('Setup cancelado');
            return;
        }

        const spinner = logger.spin('Configurando Conductor...');

        try {
            // Definir caminho
            const conductorPath = configManager.isInitialized()
                ? join(configManager.getPagiaFolder(), 'conductor')
                : '.conductor';

            conductorAgent.setConductorPath(conductorPath);

            const result = await conductorAgent.safeExecute({ prompt: '/setup' });

            spinner.succeed('Conductor configurado!');

            logger.box(result.content, { title: '✅ Setup Concluído', borderColor: 'green' });
        } catch (error) {
            spinner.fail('Erro no setup');
            logger.error(error instanceof Error ? error.message : String(error));
        }
    });

// Nova track (feature/bugfix)
conductorCommand
    .command('track [description]')
    .description('Iniciar nova track (feature ou bugfix)')
    .alias('newTrack')
    .action(async (description) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.warn('Use `pagia conductor setup` primeiro');
        }

        let trackDescription = description;

        if (!trackDescription) {
            const answers = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'type',
                    message: 'Tipo de track:',
                    choices: [
                        { name: '✨ Nova Feature', value: 'feature' },
                        { name: '🐛 Bugfix', value: 'bugfix' },
                        { name: '🔄 Improvement', value: 'improvement' },
                        { name: '🔧 Refactor', value: 'refactor' },
                    ],
                },
                {
                    type: 'input',
                    name: 'description',
                    message: 'Descreva a track:',
                    validate: (input) => input.trim().length > 0 || 'Descrição obrigatória',
                },
            ]);

            trackDescription = `[${answers.type}] ${answers.description}`;
        }

        const spinner = logger.spin('Criando track...');

        try {
            const conductorPath = configManager.isInitialized()
                ? join(configManager.getPagiaFolder(), 'conductor')
                : '.conductor';

            conductorAgent.setConductorPath(conductorPath);

            const result = await conductorAgent.safeExecute({
                prompt: `/newTrack ${trackDescription}`,
            });

            spinner.succeed('Track criada!');

            logger.box(result.content, { title: '🎯 Nova Track', borderColor: 'blue' });
        } catch (error) {
            spinner.fail('Erro ao criar track');
            logger.error(error instanceof Error ? error.message : String(error));
        }
    });

// Implementar próxima tarefa
conductorCommand
    .command('implement')
    .description('Implementar próxima tarefa da track ativa')
    .alias('impl')
    .action(async () => {
        const configManager = getConfigManager();

        logger.section('🚀 Implementando');

        const spinner = logger.spin('Buscando próxima tarefa...');

        try {
            const conductorPath = configManager.isInitialized()
                ? join(configManager.getPagiaFolder(), 'conductor')
                : '.conductor';

            conductorAgent.setConductorPath(conductorPath);

            const result = await conductorAgent.safeExecute({ prompt: '/implement' });

            spinner.stop();

            logger.box(result.content, { title: '💻 Implementação', borderColor: 'green' });
        } catch (error) {
            spinner.fail('Erro na implementação');
            logger.error(error instanceof Error ? error.message : String(error));
        }
    });

// Status do projeto
conductorCommand
    .command('status')
    .description('Verificar status do projeto e tracks')
    .action(async () => {
        const configManager = getConfigManager();

        try {
            const conductorPath = configManager.isInitialized()
                ? join(configManager.getPagiaFolder(), 'conductor')
                : '.conductor';

            conductorAgent.setConductorPath(conductorPath);

            const result = await conductorAgent.safeExecute({ prompt: '/status' });

            console.log(result.content);
        } catch (error) {
            logger.error(error instanceof Error ? error.message : String(error));
        }
    });

// Checkpoint
conductorCommand
    .command('checkpoint')
    .description('Criar checkpoint de verificação')
    .action(async () => {
        const configManager = getConfigManager();

        logger.section('🏁 Checkpoint');

        try {
            const conductorPath = configManager.isInitialized()
                ? join(configManager.getPagiaFolder(), 'conductor')
                : '.conductor';

            conductorAgent.setConductorPath(conductorPath);

            const result = await conductorAgent.safeExecute({ prompt: '/checkpoint' });

            logger.box(result.content, { title: '🏁 Verificação', borderColor: 'yellow' });
        } catch (error) {
            logger.error(error instanceof Error ? error.message : String(error));
        }
    });

// Reverter
conductorCommand
    .command('revert')
    .description('Reverter trabalho de uma track')
    .action(async () => {
        const configManager = getConfigManager();

        try {
            const conductorPath = configManager.isInitialized()
                ? join(configManager.getPagiaFolder(), 'conductor')
                : '.conductor';

            conductorAgent.setConductorPath(conductorPath);

            const result = await conductorAgent.safeExecute({ prompt: '/revert' });

            logger.box(result.content, { title: '⏪ Reverter', borderColor: 'red' });
        } catch (error) {
            logger.error(error instanceof Error ? error.message : String(error));
        }
    });

// Chat interativo
conductorCommand
    .command('chat')
    .description('Chat interativo com o Conductor')
    .action(async () => {
        const configManager = getConfigManager();

        const conductorPath = configManager.isInitialized()
            ? join(configManager.getPagiaFolder(), 'conductor')
            : '.conductor';

        conductorAgent.setConductorPath(conductorPath);

        logger.box(
            'Modo interativo com o Conductor.\n' +
            'Digite suas perguntas ou comandos.\n' +
            'Use "sair" para encerrar.',
            { title: '🎭 Conductor Chat', borderColor: 'magenta' }
        );

        while (true) {
            const { prompt } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'prompt',
                    message: chalk.cyan('→'),
                    prefix: '',
                },
            ]);

            if (prompt.toLowerCase() === 'sair' || prompt.toLowerCase() === 'exit') {
                logger.info('Até logo!');
                break;
            }

            if (!prompt.trim()) {
                continue;
            }

            const spinner = logger.spin('Processando...');

            try {
                const result = await conductorAgent.safeExecute({ prompt });
                spinner.stop();

                console.log();
                console.log(result.content);
                console.log();
            } catch (error) {
                spinner.fail('Erro');
                logger.error(error instanceof Error ? error.message : String(error));
            }
        }
    });

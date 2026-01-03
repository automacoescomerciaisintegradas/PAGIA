/**
 * PAGIA - Bundle Command
 * Empacotamento de agentes para web
 * 
 * @module commands/bundle
 * @author Automações Comerciais Integradas
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { join } from 'path';
import { getConfigManager } from '../core/config-manager.js';
import { agentRegistry } from '../agents/agent-registry.js';
import { webBundler, BundlePlatform, BundleOptions } from '../bundler/web-bundler.js';
import { logger } from '../utils/logger.js';

export const bundleCommand = new Command('bundle')
    .description('Empacotar agentes para uso web');

// Criar bundle
bundleCommand
    .command('create')
    .description('Criar bundle de agentes')
    .option('-p, --platform <platform>', 'Plataforma alvo (chatgpt, claude, gemini, generic)')
    .option('-o, --output <path>', 'Caminho de saída')
    .option('-n, --name <name>', 'Nome do bundle')
    .action(async (options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        let platform = options.platform as BundlePlatform;
        let agents = agentRegistry.list();

        // Seleção interativa
        if (!platform) {
            const answers = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'platform',
                    message: 'Selecione a plataforma de destino:',
                    choices: [
                        { name: '🤖 ChatGPT (Custom GPT)', value: 'chatgpt' },
                        { name: '🧠 Claude (Projects)', value: 'claude' },
                        { name: '💎 Gemini (Gems)', value: 'gemini' },
                        { name: '📄 Genérico (Markdown)', value: 'generic' },
                    ],
                },
                {
                    type: 'checkbox',
                    name: 'agents',
                    message: 'Selecione os agentes a incluir:',
                    choices: agents.map((a) => ({
                        name: `${a.name} - ${a.role}`,
                        value: a.id,
                        checked: true,
                    })),
                    validate: (input) => input.length > 0 || 'Selecione ao menos um agente',
                },
                {
                    type: 'input',
                    name: 'name',
                    message: 'Nome do bundle:',
                    default: 'PAGIA Bundle',
                },
                {
                    type: 'input',
                    name: 'description',
                    message: 'Descrição (opcional):',
                },
            ]);

            platform = answers.platform;
            options.name = answers.name;
            options.description = answers.description;

            // Filtrar agentes selecionados
            agents = agents.filter((a) => answers.agents.includes(a.id));
        }

        const spinner = logger.spin('Criando bundle...');

        try {
            const bundleOptions: BundleOptions = {
                name: options.name || 'PAGIA Bundle',
                description: options.description,
                version: '1.0.0',
                author: 'PAGIA',
            };

            const bundle = await webBundler.bundle(agents, platform, bundleOptions);

            // Validar
            const validation = webBundler.validate(bundle);

            if (!validation.valid) {
                spinner.warn('Bundle criado com avisos');
                validation.errors.forEach((e) => logger.error(e));
            } else {
                spinner.succeed('Bundle criado com sucesso!');
            }

            // Exibir avisos
            validation.warnings.forEach((w) => logger.warn(w));

            // Salvar
            const outputPath = options.output || join(
                configManager.getPagiaFolder(),
                'bundles',
                `${bundle.platform}-${Date.now()}.md`
            );

            await webBundler.export(bundle, outputPath);

            logger.newLine();
            logger.keyValue('Plataforma', platform);
            logger.keyValue('Agentes', String(agents.length));
            logger.keyValue('Tokens', String(validation.tokenCount));
            logger.keyValue('Limite', String(webBundler.getTokenLimit(platform)));
            logger.keyValue('Arquivo', outputPath);

            logger.newLine();
            logger.box(
                bundle.content.slice(0, 500) + '\n\n...',
                { title: '📦 Preview do Bundle', borderColor: 'cyan' }
            );
        } catch (error) {
            spinner.fail('Erro ao criar bundle');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Validar bundle
bundleCommand
    .command('validate <file>')
    .description('Validar um bundle existente')
    .action(async (file) => {
        try {
            const bundle = webBundler.load(file);
            const validation = webBundler.validate(bundle);

            logger.section('Validação do Bundle');

            if (validation.valid) {
                logger.success('Bundle válido!');
            } else {
                logger.error('Bundle inválido');
                validation.errors.forEach((e) => console.log(`  ${chalk.red('✖')} ${e}`));
            }

            if (validation.warnings.length > 0) {
                logger.newLine();
                console.log(chalk.yellow.bold('Avisos:'));
                validation.warnings.forEach((w) => console.log(`  ${chalk.yellow('⚠')} ${w}`));
            }

            logger.newLine();
            logger.keyValue('Tokens', String(validation.tokenCount));
            logger.keyValue('Limite', String(webBundler.getTokenLimit(bundle.platform)));
        } catch (error) {
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Listar plataformas
bundleCommand
    .command('platforms')
    .description('Listar plataformas suportadas')
    .action(() => {
        logger.section('Plataformas Suportadas');

        const platforms = webBundler.getSupportedPlatforms();

        for (const platform of platforms) {
            const limit = webBundler.getTokenLimit(platform);
            const icons: Record<string, string> = {
                chatgpt: '🤖',
                claude: '🧠',
                gemini: '💎',
                generic: '📄',
            };

            console.log(`  ${icons[platform] || '📦'} ${chalk.cyan(platform)} - Limite: ${limit} tokens`);
        }
    });

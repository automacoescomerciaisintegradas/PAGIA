/**
 * PAGIA - Registry Command
 * Gerenciamento do repositório de módulos
 * 
 * @module commands/registry
 * @author Automações Comerciais Integradas
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { join } from 'path';
import { getConfigManager } from '../core/config-manager.js';
import { moduleRegistry, ModuleType } from '../registry/module-registry.js';
import { logger } from '../utils/logger.js';

export const registryCommand = new Command('registry')
    .alias('reg')
    .description('Gerenciar repositório de módulos');

// Buscar módulos
registryCommand
    .command('search <query>')
    .description('Buscar módulos no registro')
    .option('-t, --type <type>', 'Filtrar por tipo (plan, agent, workflow, tool, integration)')
    .option('-l, --limit <number>', 'Limite de resultados', '10')
    .action(async (query, options) => {
        const spinner = logger.spin('Buscando módulos...');

        try {
            const results = await moduleRegistry.search(query, {
                type: options.type as ModuleType,
                limit: parseInt(options.limit),
            });

            spinner.stop();

            if (results.length === 0) {
                logger.info(`Nenhum módulo encontrado para "${query}"`);
                return;
            }

            logger.section(`Resultados para "${query}"`);

            for (const mod of results) {
                console.log(`  ${chalk.cyan('•')} ${chalk.bold(mod.name)} (${mod.code}) v${mod.version}`);
                console.log(`    ${chalk.gray(mod.description)}`);
                console.log(`    ${chalk.gray('Por:')} ${mod.author} | ${chalk.gray('Tipo:')} ${mod.type}`);
                console.log();
            }

            logger.info(`${results.length} módulo(s) encontrado(s)`);
        } catch (error) {
            spinner.fail('Erro na busca');
            logger.error(error instanceof Error ? error.message : String(error));
        }
    });

// Instalar módulo
registryCommand
    .command('install <module>')
    .description('Instalar um módulo')
    .option('-v, --version <version>', 'Versão específica')
    .option('-s, --source <source>', 'Fonte (URL ou caminho local)')
    .action(async (moduleName, options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const modulesPath = join(configManager.getPagiaFolder(), 'modules');
        moduleRegistry.setModulesPath(modulesPath);

        const spinner = logger.spin(`Instalando ${moduleName}...`);

        try {
            const installed = await moduleRegistry.install(moduleName, {
                version: options.version,
                source: options.source,
            });

            spinner.succeed(`Módulo ${moduleName} instalado!`);

            logger.newLine();
            logger.keyValue('Nome', installed.manifest.name);
            logger.keyValue('Versão', installed.manifest.version);
            logger.keyValue('Tipo', installed.manifest.pagia.type);
            logger.keyValue('Caminho', installed.path);

            if (installed.manifest.pagia.agents) {
                logger.newLine();
                logger.info(`Agentes disponíveis: ${installed.manifest.pagia.agents.join(', ')}`);
            }
        } catch (error) {
            spinner.fail('Erro na instalação');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Desinstalar módulo
registryCommand
    .command('uninstall <module>')
    .description('Desinstalar um módulo')
    .option('-f, --force', 'Não pedir confirmação')
    .action(async (moduleName, options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const modulesPath = join(configManager.getPagiaFolder(), 'modules');
        moduleRegistry.setModulesPath(modulesPath);

        if (!moduleRegistry.isInstalled(moduleName)) {
            logger.error(`Módulo não instalado: ${moduleName}`);
            process.exit(1);
        }

        if (!options.force) {
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Desinstalar ${moduleName}?`,
                    default: false,
                },
            ]);

            if (!confirm) {
                logger.info('Operação cancelada');
                return;
            }
        }

        const spinner = logger.spin(`Desinstalando ${moduleName}...`);

        try {
            await moduleRegistry.uninstall(moduleName);
            spinner.succeed(`Módulo ${moduleName} desinstalado`);
        } catch (error) {
            spinner.fail('Erro na desinstalação');
            logger.error(error instanceof Error ? error.message : String(error));
        }
    });

// Listar módulos instalados
registryCommand
    .command('list')
    .description('Listar módulos instalados')
    .option('-t, --type <type>', 'Filtrar por tipo')
    .action(async (options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const modulesPath = join(configManager.getPagiaFolder(), 'modules');
        moduleRegistry.setModulesPath(modulesPath);

        const modules = moduleRegistry.listInstalled({
            type: options.type as ModuleType,
        });

        if (modules.length === 0) {
            logger.info('Nenhum módulo instalado');
            logger.info('Use `pagia registry install <módulo>` para instalar');
            return;
        }

        logger.section('Módulos Instalados');

        for (const mod of modules) {
            const status = mod.enabled ? chalk.green('✓') : chalk.gray('○');
            console.log(`  ${status} ${chalk.bold(mod.manifest.name)} (${mod.manifest.code}) v${mod.manifest.version}`);
            console.log(`    ${chalk.gray('Tipo:')} ${mod.manifest.pagia.type}`);
            console.log(`    ${chalk.gray('Instalado em:')} ${mod.installedAt.toLocaleDateString('pt-BR')}`);
            console.log();
        }

        logger.info(`Total: ${modules.length} módulo(s)`);
    });

// Publicar módulo
registryCommand
    .command('publish <path>')
    .description('Publicar um módulo no registro')
    .action(async (modulePath) => {
        // Validar primeiro
        const validation = moduleRegistry.validate(modulePath);

        if (!validation.valid) {
            logger.error('Validação falhou:');
            validation.errors.forEach((e) => console.log(`  ${chalk.red('✖')} ${e}`));
            process.exit(1);
        }

        if (validation.warnings.length > 0) {
            console.log(chalk.yellow.bold('Avisos:'));
            validation.warnings.forEach((w) => console.log(`  ${chalk.yellow('⚠')} ${w}`));
        }

        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Publicar módulo?',
                default: true,
            },
        ]);

        if (!confirm) {
            logger.info('Operação cancelada');
            return;
        }

        const spinner = logger.spin('Publicando módulo...');

        const result = await moduleRegistry.publish(modulePath);

        if (result.success) {
            spinner.succeed(result.message);
        } else {
            spinner.fail(result.message);
        }
    });

// Validar módulo
registryCommand
    .command('validate <path>')
    .description('Validar estrutura de um módulo')
    .action(async (modulePath) => {
        logger.section('Validando Módulo');

        const result = moduleRegistry.validate(modulePath);

        if (result.valid) {
            logger.success('Módulo válido!');
        } else {
            logger.error('Módulo inválido');
            result.errors.forEach((e) => console.log(`  ${chalk.red('✖')} ${e}`));
        }

        if (result.warnings.length > 0) {
            logger.newLine();
            console.log(chalk.yellow.bold('Avisos:'));
            result.warnings.forEach((w) => console.log(`  ${chalk.yellow('⚠')} ${w}`));
        }
    });

// Criar scaffold de módulo
registryCommand
    .command('create <name>')
    .description('Criar estrutura de um novo módulo')
    .option('-t, --type <type>', 'Tipo do módulo', 'agent')
    .option('-o, --output <path>', 'Diretório de saída', '.')
    .action(async (name, options) => {
        const { type: moduleType } = await inquirer.prompt([
            {
                type: 'list',
                name: 'type',
                message: 'Tipo de módulo:',
                choices: [
                    { name: '🤖 Agente', value: 'agent' },
                    { name: '📋 Plano', value: 'plan' },
                    { name: '🔄 Workflow', value: 'workflow' },
                    { name: '🔧 Ferramenta', value: 'tool' },
                    { name: '🔗 Integração', value: 'integration' },
                ],
                default: options.type,
            },
        ]);

        const spinner = logger.spin('Criando estrutura do módulo...');

        try {
            const modulePath = await moduleRegistry.scaffold(name, moduleType, options.output);
            spinner.succeed('Módulo criado!');

            logger.newLine();
            logger.keyValue('Caminho', modulePath);
            logger.keyValue('Tipo', moduleType);

            logger.newLine();
            logger.info('Próximos passos:');
            logger.list([
                `Edite o manifesto em ${modulePath}/module.yaml`,
                'Implemente a lógica do módulo',
                'Valide com `pagia registry validate`',
                'Publique com `pagia registry publish`',
            ]);
        } catch (error) {
            spinner.fail('Erro ao criar módulo');
            logger.error(error instanceof Error ? error.message : String(error));
        }
    });

// Habilitar/Desabilitar módulo
registryCommand
    .command('toggle <module>')
    .description('Habilitar/Desabilitar um módulo')
    .action(async (moduleName) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const modulesPath = join(configManager.getPagiaFolder(), 'modules');
        moduleRegistry.setModulesPath(modulesPath);

        const installed = moduleRegistry.getInstalled(moduleName);

        if (!installed) {
            logger.error(`Módulo não instalado: ${moduleName}`);
            process.exit(1);
        }

        if (installed.enabled) {
            moduleRegistry.disable(moduleName);
            logger.success(`Módulo ${moduleName} desabilitado`);
        } else {
            moduleRegistry.enable(moduleName);
            logger.success(`Módulo ${moduleName} habilitado`);
        }
    });

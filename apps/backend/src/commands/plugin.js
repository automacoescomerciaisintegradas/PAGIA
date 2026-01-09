/**
 * PAGIA - Plugin Command
 * Gerenciamento de plugins
 */
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { logger } from '../utils/logger.js';
import { pluginManager } from '../core/plugin-system.js';
export const pluginCommand = new Command('plugin')
    .description('Gerenciar plugins PAGIA');
// List plugins
pluginCommand
    .command('list')
    .description('Listar plugins instalados')
    .action(async () => {
    await pluginManager.loadAll();
    const plugins = pluginManager.list();
    logger.section('Plugins Instalados');
    if (plugins.length === 0) {
        logger.info('Nenhum plugin instalado.');
        logger.info('Use `pagia plugin create <nome>` para criar um plugin.');
        return;
    }
    for (const plugin of plugins) {
        const status = plugin.enabled
            ? chalk.green('●')
            : chalk.gray('○');
        console.log(`${status} ${chalk.bold(plugin.manifest.name)} ${chalk.gray(`v${plugin.manifest.version}`)}`);
        console.log(`  ${chalk.gray(plugin.manifest.description)}`);
        if (plugin.manifest.commands && plugin.manifest.commands.length > 0) {
            console.log(`  ${chalk.cyan('Commands:')} ${plugin.manifest.commands.map(c => c.name).join(', ')}`);
        }
        if (plugin.manifest.agents && plugin.manifest.agents.length > 0) {
            console.log(`  ${chalk.yellow('Agents:')} ${plugin.manifest.agents.map(a => a.name).join(', ')}`);
        }
        if (plugin.manifest.hooks && plugin.manifest.hooks.length > 0) {
            console.log(`  ${chalk.magenta('Hooks:')} ${plugin.manifest.hooks.map(h => h.event).join(', ')}`);
        }
        console.log();
    }
    logger.info(`Total: ${plugins.length} plugin(s)`);
});
// Create plugin
pluginCommand
    .command('create <name>')
    .description('Criar novo plugin')
    .option('-d, --description <description>', 'Descrição do plugin')
    .option('-a, --author <author>', 'Autor do plugin')
    .action(async (name, options) => {
    const spinner = logger.spin(`Criando plugin "${name}"...`);
    try {
        const pluginPath = await pluginManager.create(name, {
            description: options.description,
            author: options.author,
        });
        spinner.succeed(`Plugin "${name}" criado com sucesso!`);
        logger.newLine();
        logger.keyValue('Local', pluginPath);
        logger.newLine();
        logger.info('Estrutura criada:');
        logger.list([
            'plugin.json - Manifest do plugin',
            'commands/ - Comandos personalizados',
            'agents/ - Agentes do plugin',
            'hooks/ - Hooks de eventos',
            'README.md - Documentação',
        ]);
        logger.newLine();
        logger.info('Próximos passos:');
        logger.list([
            `Edite ${pluginPath}/plugin.json para configurar o plugin`,
            `Adicione agentes em ${pluginPath}/agents/`,
            `Use 'pagia plugin list' para ver o plugin`,
        ]);
    }
    catch (error) {
        spinner.fail('Erro ao criar plugin');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
});
// Install plugin
pluginCommand
    .command('install <source>')
    .description('Instalar plugin (npm, git, ou local)')
    .action(async (source) => {
    const spinner = logger.spin(`Instalando plugin de "${source}"...`);
    try {
        await pluginManager.install(source);
        spinner.succeed('Plugin instalado com sucesso!');
    }
    catch (error) {
        spinner.fail('Erro ao instalar plugin');
        logger.error(error instanceof Error ? error.message : String(error));
        logger.info('Instalação via npm/git ainda não implementada.');
        logger.info('Use `pagia plugin create <nome>` para criar um plugin local.');
        process.exit(1);
    }
});
// Remove plugin
pluginCommand
    .command('remove <name>')
    .description('Remover plugin')
    .action(async (name) => {
    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: `Tem certeza que deseja remover o plugin "${name}"?`,
            default: false,
        },
    ]);
    if (!confirm) {
        logger.info('Operação cancelada.');
        return;
    }
    await pluginManager.loadAll();
    const removed = await pluginManager.remove(name);
    if (removed) {
        logger.success(`Plugin "${name}" removido com sucesso!`);
    }
    else {
        logger.error(`Plugin "${name}" não encontrado.`);
    }
});
// Show plugin info
pluginCommand
    .command('info <name>')
    .description('Mostrar informações de um plugin')
    .action(async (name) => {
    await pluginManager.loadAll();
    const plugin = pluginManager.get(name);
    if (!plugin) {
        logger.error(`Plugin "${name}" não encontrado.`);
        process.exit(1);
    }
    logger.section(`Plugin: ${plugin.manifest.name}`);
    logger.keyValue('Versão', plugin.manifest.version);
    logger.keyValue('Autor', plugin.manifest.author);
    logger.keyValue('Descrição', plugin.manifest.description);
    logger.keyValue('Local', plugin.path);
    logger.keyValue('Status', plugin.enabled ? 'Ativado' : 'Desativado');
    if (plugin.manifest.commands && plugin.manifest.commands.length > 0) {
        logger.newLine();
        console.log(chalk.bold('Commands:'));
        for (const cmd of plugin.manifest.commands) {
            console.log(`  ${chalk.cyan(cmd.name)} - ${cmd.description}`);
        }
    }
    if (plugin.manifest.agents && plugin.manifest.agents.length > 0) {
        logger.newLine();
        console.log(chalk.bold('Agents:'));
        for (const agent of plugin.manifest.agents) {
            console.log(`  ${chalk.yellow(agent.name)} - ${agent.file}`);
        }
    }
    if (plugin.manifest.hooks && plugin.manifest.hooks.length > 0) {
        logger.newLine();
        console.log(chalk.bold('Hooks:'));
        for (const hook of plugin.manifest.hooks) {
            console.log(`  ${chalk.magenta(hook.event)} - ${hook.handler}`);
        }
    }
});
//# sourceMappingURL=plugin.js.map
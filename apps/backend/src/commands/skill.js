/**
 * PAGIA - Skill Command
 * Gerenciamento de Skills (Habilidades)
 *
 * Baseado no formato Anthropic Skills:
 * @see https://github.com/anthropics/skills
 *
 * @module commands/skill
 * @author Automações Comerciais Integradas
 */
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getConfigManager } from '../core/config-manager.js';
import { skillRegistry, mcpToolsManager } from '../skills/index.js';
import { createAIService } from '../core/ai-service.js';
import { logger } from '../utils/logger.js';
export const skillCommand = new Command('skill')
    .alias('sk')
    .description('Gerenciar Skills (Habilidades)');
// Listar skills
skillCommand
    .command('list')
    .description('Listar skills disponíveis')
    .option('-i, --installed', 'Mostrar apenas skills instaladas')
    .option('-e, --enabled', 'Mostrar apenas skills habilitadas')
    .action(async (options) => {
    const configManager = getConfigManager();
    const skillsPath = configManager.isInitialized()
        ? join(configManager.getPagiaFolder(), 'skills')
        : join(process.cwd(), '.pagia', 'skills');
    skillRegistry.setSkillsPath(skillsPath);
    logger.section('📚 Skills Disponíveis');
    if (options.installed || options.enabled) {
        const installed = skillRegistry.listInstalled({
            enabled: options.enabled ? true : undefined,
        });
        if (installed.length === 0) {
            logger.info('Nenhuma skill instalada');
            logger.info('Use `pagia skill create` para criar uma nova skill');
            return;
        }
        for (const item of installed) {
            const status = item.enabled ? chalk.green('✓') : chalk.gray('○');
            console.log(`  ${status} ${chalk.bold(item.skill.frontmatter.name)}`);
            console.log(`    ${chalk.gray(item.skill.frontmatter.description)}`);
            if (item.skill.frontmatter.tags?.length) {
                console.log(`    ${chalk.cyan('Tags:')} ${item.skill.frontmatter.tags.join(', ')}`);
            }
            console.log(`    ${chalk.gray('Fonte:')} ${item.source} | ${chalk.gray('Instalado:')} ${item.installedAt.toLocaleDateString('pt-BR')}`);
            console.log();
        }
        logger.info(`Total: ${installed.length} skill(s)`);
    }
    else {
        const skills = skillRegistry.listSkills();
        if (skills.length === 0) {
            logger.info('Nenhuma skill encontrada');
            logger.info('Use `pagia skill create` para criar uma nova skill');
            return;
        }
        for (const skill of skills) {
            const validIcon = skill.isValid ? chalk.green('✓') : chalk.red('✗');
            console.log(`  ${validIcon} ${chalk.bold(skill.frontmatter.name)} v${skill.frontmatter.version || '1.0.0'}`);
            console.log(`    ${chalk.gray(skill.frontmatter.description)}`);
            if (!skill.isValid) {
                console.log(`    ${chalk.red('Erros:')} ${skill.validationErrors.join(', ')}`);
            }
            if (skill.frontmatter.tags?.length) {
                console.log(`    ${chalk.cyan('Tags:')} ${skill.frontmatter.tags.join(', ')}`);
            }
            console.log();
        }
        logger.info(`Total: ${skills.length} skill(s)`);
    }
});
// Criar skill
skillCommand
    .command('create [name]')
    .description('Criar nova skill')
    .option('-d, --description <desc>', 'Descrição da skill')
    .option('-a, --author <author>', 'Autor')
    .option('-t, --tags <tags>', 'Tags separadas por vírgula')
    .option('-o, --output <path>', 'Diretório de saída')
    .action(async (name, options) => {
    const configManager = getConfigManager();
    const skillsPath = configManager.isInitialized()
        ? join(configManager.getPagiaFolder(), 'skills')
        : join(process.cwd(), '.pagia', 'skills');
    skillRegistry.setSkillsPath(skillsPath);
    let skillName = name;
    let description = options.description;
    let author = options.author;
    let tags = options.tags ? options.tags.split(',').map((t) => t.trim()) : [];
    if (!skillName) {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Nome da skill (lowercase, hyphens):',
                validate: (input) => {
                    const validation = skillRegistry.validateName(input);
                    return validation.valid || validation.errors.join(', ');
                },
            },
            {
                type: 'input',
                name: 'description',
                message: 'Descrição (max 1024 chars):',
                validate: (input) => {
                    const validation = skillRegistry.validateDescription(input);
                    return validation.valid || validation.errors.join(', ');
                },
            },
            {
                type: 'input',
                name: 'author',
                message: 'Autor (opcional):',
            },
            {
                type: 'input',
                name: 'tags',
                message: 'Tags (separadas por vírgula):',
            },
        ]);
        skillName = answers.name;
        description = answers.description;
        author = answers.author;
        tags = answers.tags ? answers.tags.split(',').map((t) => t.trim()) : [];
    }
    const spinner = logger.spin('Criando skill...');
    try {
        const skillPath = await skillRegistry.scaffold(skillName, {
            description,
            author,
            tags,
            outputPath: options.output,
        });
        spinner.succeed('Skill criada com sucesso!');
        logger.newLine();
        logger.keyValue('Nome', skillName);
        logger.keyValue('Caminho', skillPath);
        logger.newLine();
        logger.info('Próximos passos:');
        logger.list([
            `Edite ${join(skillPath, 'SKILL.md')} com suas instruções`,
            `Valide com: pagia skill validate "${skillPath}"`,
            `Instale com: pagia skill install "${skillPath}"`,
        ]);
    }
    catch (error) {
        spinner.fail('Erro ao criar skill');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
});
// Validar skill
skillCommand
    .command('validate <path>')
    .description('Validar estrutura de uma skill')
    .action(async (skillPath) => {
    logger.section('🔍 Validando Skill');
    const result = skillRegistry.validate(skillPath);
    if (result.valid) {
        logger.success('Skill válida!');
    }
    else {
        logger.error('Skill inválida:');
        result.errors.forEach(e => console.log(`  ${chalk.red('✗')} ${e}`));
    }
    if (result.warnings.length > 0) {
        logger.newLine();
        console.log(chalk.yellow.bold('Avisos:'));
        result.warnings.forEach(w => console.log(`  ${chalk.yellow('⚠')} ${w}`));
    }
});
// Instalar skill
skillCommand
    .command('install <source>')
    .description('Instalar uma skill (caminho local ou URL GitHub)')
    .action(async (source) => {
    const configManager = getConfigManager();
    const skillsPath = configManager.isInitialized()
        ? join(configManager.getPagiaFolder(), 'skills')
        : join(process.cwd(), '.pagia', 'skills');
    skillRegistry.setSkillsPath(skillsPath);
    const spinner = logger.spin('Instalando skill...');
    try {
        let installed;
        if (source.startsWith('http') || source.includes('github.com')) {
            installed = await skillRegistry.installFromGitHub(source);
        }
        else {
            installed = await skillRegistry.installFromLocal(source);
        }
        spinner.succeed('Skill instalada!');
        logger.newLine();
        logger.keyValue('Nome', installed.skill.frontmatter.name);
        logger.keyValue('Versão', installed.skill.frontmatter.version || '1.0.0');
        logger.keyValue('Descrição', installed.skill.frontmatter.description);
        logger.newLine();
        logger.info(`Use: pagia skill run ${installed.skill.frontmatter.name}`);
    }
    catch (error) {
        spinner.fail('Erro na instalação');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
});
// Desinstalar skill
skillCommand
    .command('uninstall <name>')
    .description('Desinstalar uma skill')
    .option('-f, --force', 'Não pedir confirmação')
    .action(async (name, options) => {
    const configManager = getConfigManager();
    const skillsPath = configManager.isInitialized()
        ? join(configManager.getPagiaFolder(), 'skills')
        : join(process.cwd(), '.pagia', 'skills');
    skillRegistry.setSkillsPath(skillsPath);
    if (!skillRegistry.isInstalled(name)) {
        logger.error(`Skill não instalada: ${name}`);
        process.exit(1);
    }
    if (!options.force) {
        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Desinstalar skill "${name}"?`,
                default: false,
            },
        ]);
        if (!confirm) {
            logger.info('Operação cancelada');
            return;
        }
    }
    const spinner = logger.spin('Desinstalando...');
    try {
        await skillRegistry.uninstall(name);
        spinner.succeed(`Skill "${name}" desinstalada`);
    }
    catch (error) {
        spinner.fail('Erro na desinstalação');
        logger.error(error instanceof Error ? error.message : String(error));
    }
});
// Habilitar/Desabilitar skill
skillCommand
    .command('toggle <name>')
    .description('Habilitar/Desabilitar uma skill')
    .action(async (name) => {
    const configManager = getConfigManager();
    const skillsPath = configManager.isInitialized()
        ? join(configManager.getPagiaFolder(), 'skills')
        : join(process.cwd(), '.pagia', 'skills');
    skillRegistry.setSkillsPath(skillsPath);
    const installed = skillRegistry.getInstalled(name);
    if (!installed) {
        logger.error(`Skill não instalada: ${name}`);
        process.exit(1);
    }
    if (installed.enabled) {
        skillRegistry.disable(name);
        logger.success(`Skill "${name}" desabilitada`);
    }
    else {
        skillRegistry.enable(name);
        logger.success(`Skill "${name}" habilitada`);
    }
});
// Executar skill
skillCommand
    .command('run <name>')
    .description('Executar uma skill com IA')
    .option('-p, --prompt <prompt>', 'Prompt para a skill')
    .option('-m, --model <model>', 'Modelo de IA a usar')
    .option('--ollama', 'Usar Ollama local')
    .option('--ollama-model <model>', 'Modelo Ollama específico', 'gemma2')
    .action(async (name, options) => {
    const configManager = getConfigManager();
    // Determinar caminhos de busca
    const searchPaths = [];
    // 1. Projeto inicializado
    if (configManager.isInitialized()) {
        searchPaths.push(join(configManager.getPagiaFolder(), 'skills'));
    }
    // 2. Diretório atual
    searchPaths.push(join(process.cwd(), '.pagia', 'skills'));
    // 3. Diretório de instalação do PAGIA (para uso global)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const pagiaInstallDir = join(__dirname, '..', '..', '.pagia', 'skills');
    searchPaths.push(pagiaInstallDir);
    let skill = null;
    let installed = null;
    // Tentar em cada caminho
    for (const skillsPath of searchPaths) {
        skillRegistry.setSkillsPath(skillsPath);
        // 1. Tentar skill instalada
        installed = skillRegistry.getInstalled(name);
        if (installed) {
            if (!installed.enabled) {
                logger.warn(`Skill "${name}" está desabilitada. Habilitando...`);
                skillRegistry.enable(name);
            }
            await runSkillWithAI(installed.skill, options);
            return;
        }
        // 2. Tentar carregar do diretório de skills pelo nome
        const skillDir = join(skillsPath, name);
        skill = skillRegistry.loadSkillFromFile(skillDir);
        if (skill && skill.frontmatter) {
            await runSkillWithAI(skill, options);
            return;
        }
    }
    // 3. Tentar caminho como fornecido (para skills avulsas)
    skill = skillRegistry.loadSkillFromFile(name);
    if (skill && skill.frontmatter) {
        await runSkillWithAI(skill, options);
        return;
    }
    // Não encontrou
    logger.error(`Skill não encontrada: ${name}`);
    logger.info('Use `pagia skill list` para ver skills disponíveis');
    logger.info(`Caminhos pesquisados: ${searchPaths.join(', ')}`);
    process.exit(1);
});
// Buscar skills
skillCommand
    .command('search <query>')
    .description('Buscar skills por termo')
    .action(async (query) => {
    const configManager = getConfigManager();
    const skillsPath = configManager.isInitialized()
        ? join(configManager.getPagiaFolder(), 'skills')
        : join(process.cwd(), '.pagia', 'skills');
    skillRegistry.setSkillsPath(skillsPath);
    const results = skillRegistry.search(query);
    if (results.length === 0) {
        logger.info(`Nenhuma skill encontrada para "${query}"`);
        return;
    }
    logger.section(`Resultados para "${query}"`);
    for (const skill of results) {
        console.log(`  ${chalk.cyan('•')} ${chalk.bold(skill.frontmatter.name)}`);
        console.log(`    ${chalk.gray(skill.frontmatter.description)}`);
        console.log();
    }
    logger.info(`${results.length} skill(s) encontrada(s)`);
});
// Info de uma skill
skillCommand
    .command('info <name>')
    .description('Mostrar informações detalhadas de uma skill')
    .action(async (name) => {
    const configManager = getConfigManager();
    const skillsPath = configManager.isInitialized()
        ? join(configManager.getPagiaFolder(), 'skills')
        : join(process.cwd(), '.pagia', 'skills');
    skillRegistry.setSkillsPath(skillsPath);
    const installed = skillRegistry.getInstalled(name);
    if (!installed) {
        logger.error(`Skill não encontrada: ${name}`);
        process.exit(1);
    }
    const skill = installed.skill;
    logger.section(`📚 ${skill.frontmatter.name}`);
    console.log(chalk.gray(skill.frontmatter.description));
    console.log();
    logger.keyValue('Versão', skill.frontmatter.version || '1.0.0');
    logger.keyValue('Autor', skill.frontmatter.author || 'Não especificado');
    logger.keyValue('Tags', skill.frontmatter.tags?.join(', ') || 'Nenhuma');
    logger.keyValue('Habilitada', installed.enabled ? 'Sim' : 'Não');
    logger.keyValue('Fonte', installed.source);
    logger.keyValue('Instalada em', installed.installedAt.toLocaleDateString('pt-BR'));
    logger.keyValue('Caminho', skill.filePath);
    if (skill.frontmatter.tools?.length) {
        logger.newLine();
        logger.keyValue('Ferramentas MCP', skill.frontmatter.tools.join(', '));
    }
    if (skill.frontmatter.dependencies?.length) {
        logger.newLine();
        logger.keyValue('Dependências', skill.frontmatter.dependencies.join(', '));
    }
    logger.newLine();
    logger.info('Instruções:');
    console.log(chalk.gray('---'));
    console.log(skill.instructions.substring(0, 500));
    if (skill.instructions.length > 500) {
        console.log(chalk.gray(`... (${skill.instructions.length} caracteres total)`));
    }
});
/**
 * Executa uma skill com IA
 */
async function runSkillWithAI(skill, options) {
    let prompt = options.prompt;
    if (!prompt) {
        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'prompt',
                message: `[${skill.frontmatter.name}] Digite sua solicitação:`,
            },
        ]);
        prompt = answer.prompt;
    }
    const spinner = logger.spin('Processando com IA...');
    try {
        const configManager = getConfigManager();
        const config = configManager.isInitialized() ? configManager.load() : null;
        // Configurar provedor de IA
        let aiConfig;
        if (options.ollama) {
            // Usar Ollama - prioridade: CLI > env > skill > default
            const ollamaModel = options.ollamaModel !== 'gemma2'
                ? options.ollamaModel
                : process.env.OLLAMA_MODEL || skill.frontmatter.model?.name || 'llama3.1:latest';
            aiConfig = {
                type: 'ollama',
                model: ollamaModel,
            };
        }
        else if (skill.frontmatter.model?.provider) {
            // Usar modelo especificado na skill
            aiConfig = {
                type: skill.frontmatter.model.provider,
                model: skill.frontmatter.model.name,
            };
        }
        else if (config?.aiProvider) {
            // Usar configuração do projeto
            aiConfig = config.aiProvider;
        }
        else {
            // Fallback para ambiente
            aiConfig = {};
        }
        if (options.model) {
            aiConfig.model = options.model;
        }
        const aiService = createAIService(aiConfig);
        // Combinar instruções da skill com o prompt
        let systemPrompt = skill.instructions;
        // Se a skill tem MCP tools, adicionar informações sobre elas
        if (mcpToolsManager.canUseTools(skill.frontmatter)) {
            const allowedTools = mcpToolsManager.getAllowedTools(skill.frontmatter);
            if (allowedTools.length > 0) {
                systemPrompt += '\n\n## 🛠️ Ferramentas MCP Disponíveis\n\n';
                systemPrompt += 'Você tem acesso às seguintes ferramentas MCP:\n\n';
                for (const tool of allowedTools) {
                    systemPrompt += `### ${tool.name}\n`;
                    systemPrompt += `${tool.description}\n\n`;
                    systemPrompt += '```json\n';
                    systemPrompt += JSON.stringify(tool.inputSchema, null, 2);
                    systemPrompt += '\n```\n\n';
                }
                systemPrompt += 'IMPORTANTE: Mencione quando você usaria essas ferramentas para resolver a tarefa.\n';
            }
        }
        const userPrompt = prompt || '';
        const response = await aiService.generate(userPrompt, systemPrompt);
        spinner.stop();
        // Exibir resposta
        if (process.platform === 'win32') {
            console.log(`\n${'═'.repeat(60)}`);
            console.log(`📚 ${skill.frontmatter.name}`);
            console.log(`${'═'.repeat(60)}\n`);
            console.log(response.content);
            console.log(`\n${'─'.repeat(60)}`);
            console.log(`Modelo: ${response.model} | Tokens: ${response.tokensUsed || 'N/A'}`);
        }
        else {
            logger.box(response.content, {
                title: `📚 ${skill.frontmatter.name}`,
                borderColor: 'cyan',
            });
            logger.keyValue('Modelo', response.model);
            logger.keyValue('Tokens', String(response.tokensUsed || 'N/A'));
        }
    }
    catch (error) {
        spinner.fail('Erro ao executar skill');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
//# sourceMappingURL=skill.js.map
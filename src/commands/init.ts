/**
 * PAGIA - Init Command
 * Inicialização do PAGIA no projeto
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { getConfigManager } from '../core/config-manager.js';
import { logger } from '../utils/logger.js';
import type { AIProviderType, ModuleConfig } from '../types/index.js';

export const initCommand = new Command('init')
    .description('Inicializar PAGIA no projeto atual')
    .option('-y, --yes', 'Usar configurações padrão sem perguntar')
    .option('-v, --verbose', 'Modo verboso')
    .action(async (options) => {
        const configManager = getConfigManager();

        // Check if already initialized
        if (configManager.isInitialized()) {
            const { overwrite } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: chalk.yellow('PAGIA já está inicializado neste projeto. Deseja sobrescrever?'),
                    default: false,
                },
            ]);

            if (!overwrite) {
                logger.info('Operação cancelada.');
                return;
            }
        }

        let config: any = {};

        if (!options.yes) {
            // Interactive configuration
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'userName',
                    message: 'Qual é seu nome?',
                    default: process.env.USER_NAME || 'Developer',
                },
                {
                    type: 'list',
                    name: 'language',
                    message: 'Idioma de comunicação:',
                    choices: [
                        { name: 'Português (Brasil)', value: 'pt-BR' },
                        { name: 'English', value: 'en' },
                        { name: 'Español', value: 'es' },
                    ],
                    default: 'pt-BR',
                },
                {
                    type: 'list',
                    name: 'aiProvider',
                    message: 'Provedor de IA principal:',
                    choices: [
                        { name: '🔮 Google Gemini (Recomendado)', value: 'gemini' },
                        { name: '🤖 OpenAI (GPT)', value: 'openai' },
                        { name: '🧠 Anthropic (Claude)', value: 'anthropic' },
                        { name: '⚡ Groq (Rápido)', value: 'groq' },
                        { name: '🦙 Ollama (Local)', value: 'ollama' },
                        { name: '🌊 DeepSeek', value: 'deepseek' },
                        { name: '🌬️ Mistral AI', value: 'mistral' },
                        { name: '🔀 OpenRouter (Multi-modelo)', value: 'openrouter' },
                    ],
                    default: 'gemini',
                },
                {
                    type: 'input',
                    name: 'apiKey',
                    message: (answers: any) => {
                        const envKey = getEnvApiKey(answers.aiProvider);
                        if (envKey) {
                            return `API Key do ${answers.aiProvider} (detectada no .env, pressione Enter para usar):`;
                        }
                        return `API Key do ${answers.aiProvider} (ou deixe vazio se já estiver no .env):`;
                    },
                    when: (answers: any) => {
                        // Só perguntar se não for ollama E não tiver key no .env
                        if (answers.aiProvider === 'ollama') return false;
                        const envKey = getEnvApiKey(answers.aiProvider);
                        if (envKey) {
                            // Key já existe no .env, não precisa perguntar
                            console.log(chalk.green(`\n   ✓ API Key do ${answers.aiProvider} detectada no .env`));
                            return false;
                        }
                        return true;
                    },
                    validate: (input: string) => {
                        // Permite vazio se já tiver no .env
                        return true;
                    },
                },
                {
                    type: 'input',
                    name: 'ollamaUrl',
                    message: 'URL do Ollama:',
                    when: (answers: any) => answers.aiProvider === 'ollama',
                    default: 'http://localhost:11434',
                },
                {
                    type: 'checkbox',
                    name: 'modules',
                    message: 'Módulos a instalar:',
                    choices: [
                        { name: '📊 Plano de Ação Global (Alto Nível)', value: 'global-plan', checked: true },
                        { name: '📋 Plano de Ação por Etapa/Tópico', value: 'stage-plan', checked: true },
                        { name: '💬 Plano de Ação por Prompt', value: 'prompt-plan', checked: true },
                        { name: '🤖 Plano de Ação Controlado pela IA', value: 'ai-plan', checked: true },
                    ],
                },
                {
                    type: 'confirm',
                    name: 'debug',
                    message: 'Habilitar modo debug?',
                    default: false,
                },
            ]);

            // Determinar a API key a usar (prioridade: resposta > .env)
            let apiKeyToUse = answers.apiKey;
            if (!apiKeyToUse && answers.aiProvider !== 'ollama') {
                const envKey = getEnvApiKey(answers.aiProvider);
                if (envKey) {
                    // Usar referência à variável de ambiente em vez do valor
                    apiKeyToUse = `$env:${getEnvKeyName(answers.aiProvider)}`;
                }
            }

            config = {
                userName: answers.userName,
                language: answers.language,
                debug: answers.debug,
                aiProvider: {
                    type: answers.aiProvider as AIProviderType,
                    apiKey: apiKeyToUse,
                    model: getDefaultModel(answers.aiProvider),
                },
                modules: createModulesConfig(answers.modules),
            };
        }

        // Initialize PAGIA
        const spinner = logger.spin('Inicializando PAGIA...');

        try {
            const finalConfig = await configManager.initialize(config);

            spinner.text = 'Instalando agentes padrão...';

            // Instalar agentes automaticamente
            const { setupBMADAgents } = await import('../scripts/setup-bmad-agents.js');
            await setupBMADAgents();

            // Instalar agentes extras (plan-creator, code-optimizer, dev)
            await installExtraAgents(configManager.getPagiaFolder());

            spinner.succeed('PAGIA inicializado com sucesso!');

            // Show summary
            logger.newLine();
            logger.box(
                `${chalk.bold('PAGIA Configurado!')}\n\n` +
                `${chalk.gray('Usuário:')} ${finalConfig.userName}\n` +
                `${chalk.gray('Idioma:')} ${finalConfig.language}\n` +
                `${chalk.gray('Provedor IA:')} ${finalConfig.aiProvider.type}\n` +
                `${chalk.gray('Modelo:')} ${finalConfig.aiProvider.model}\n` +
                `${chalk.gray('Módulos:')} ${finalConfig.modules.filter((m) => m.enabled).length} ativos`,
                { title: '✅ Inicialização Completa', borderColor: 'green' }
            );

            logger.newLine();
            logger.info('Próximos passos:');
            logger.list([
                'pagia status - Ver status do projeto',
                'pagia plan create - Criar um plano de ação',
                'pagia agent list - Listar agentes disponíveis',
            ]);
        } catch (error) {
            spinner.fail('Erro ao inicializar PAGIA');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

function getDefaultModel(provider: string): string {
    switch (provider) {
        case 'gemini':
            return 'gemini-2.5-pro-preview-06-05'; // Gemini 3 Pro (Low)
        case 'openai':
            return 'gpt-4o';
        case 'anthropic':
            return 'claude-sonnet-4-20250514';
        case 'groq':
            return 'llama-3.3-70b-versatile';
        case 'ollama':
            return 'llama3.2';
        case 'deepseek':
            return 'deepseek-chat';
        case 'mistral':
            return 'mistral-large-latest';
        case 'openrouter':
            return 'anthropic/claude-sonnet-4';
        default:
            return 'gemini-2.5-pro-preview-06-05';
    }
}

function createModulesConfig(selectedModules: string[]): ModuleConfig[] {
    const allModules = [
        { code: 'core', name: 'Core', enabled: true, config: {} },
        { code: 'global-plan', name: 'Plano de Ação Global', enabled: false, config: {} },
        { code: 'stage-plan', name: 'Plano de Ação por Etapa', enabled: false, config: {} },
        { code: 'prompt-plan', name: 'Plano de Ação por Prompt', enabled: false, config: {} },
        { code: 'ai-plan', name: 'Plano de Ação Controlado pela IA', enabled: false, config: {} },
    ];

    return allModules.map((module) => ({
        ...module,
        enabled: module.code === 'core' || selectedModules.includes(module.code),
    }));
}

function getEnvApiKey(provider: string): string | undefined {
    const envKeys: Record<string, string> = {
        gemini: 'GEMINI_API_KEY',
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        groq: 'GROQ_API_KEY',
        deepseek: 'DEEPSEEK_API_KEY',
        mistral: 'MISTRAL_API_KEY',
        openrouter: 'OPENROUTER_API_KEY',
    };

    const envKey = envKeys[provider];
    if (envKey && process.env[envKey]) {
        return process.env[envKey];
    }
    return undefined;
}

function getEnvKeyName(provider: string): string {
    const envKeys: Record<string, string> = {
        gemini: 'GEMINI_API_KEY',
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        groq: 'GROQ_API_KEY',
        deepseek: 'DEEPSEEK_API_KEY',
        mistral: 'MISTRAL_API_KEY',
        openrouter: 'OPENROUTER_API_KEY',
    };
    return envKeys[provider] || `${provider.toUpperCase()}_API_KEY`;
}

async function installExtraAgents(pagiaFolder: string): Promise<void> {
    const { existsSync, writeFileSync, mkdirSync } = await import('fs');
    const { join } = await import('path');

    const agentsFolder = join(pagiaFolder, 'core', 'agents');

    if (!existsSync(agentsFolder)) {
        mkdirSync(agentsFolder, { recursive: true });
    }

    const extraAgents = [
        {
            id: 'dev',
            name: 'Dev',
            role: 'Agente de Desenvolvimento de Código',
            content: `# Dev

## Papel
Agente de Desenvolvimento de Código

## Descrição
Agente especializado em desenvolvimento de código, implementação de funcionalidades e boas práticas de programação.

## Capacidades
- Desenvolvimento de código limpo
- Implementação de funcionalidades
- Refatoração de código
- Debugging e correção de bugs
- Integração de APIs
- Testes unitários

## Instruções
Como Desenvolvedor, você deve:

1. **Código Limpo:**
   - Seguir princípios SOLID
   - Usar nomes descritivos
   - Manter funções pequenas

2. **Implementação:**
   - Analisar requisitos antes de codificar
   - Considerar edge cases
   - Documentar código complexo

3. **Qualidade:**
   - Escrever testes
   - Fazer code review
   - Otimizar performance

## Menu
- \`/code\` - Gerar código
- \`/refactor\` - Refatorar código
- \`/debug\` - Debugar problema
- \`/test\` - Criar testes

---
*Agente PAGIA - Gerado automaticamente*
`,
        },
        {
            id: 'plan-creator',
            name: 'Plan Creator',
            role: 'Especialista em Planejamento Estratégico',
            content: `# Plan Creator

## Papel
Especialista em Planejamento Estratégico

## Descrição
Agente especializado em criar planos de ação estruturados, detalhados e prontos para execução.

## Capacidades
- Análise de requisitos e escopo
- Definição de objetivos SMART
- Estruturação de etapas lógicas
- Estimativa de prazos realistas
- Identificação de riscos
- Critérios de sucesso

## Instruções
Transforme solicitações do usuário em planos de ação completos.

Responda em **JSON válido**:
\`\`\`json
{
  "name": "Nome do Plano",
  "type": "global",
  "description": "Descrição detalhada",
  "objectives": ["Objetivo 1", "Objetivo 2"],
  "stages": ["Etapa 1", "Etapa 2"],
  "milestones": ["Marco 1", "Marco 2"]
}
\`\`\`

Regras:
1. Seja Específico
2. Seja Realista
3. Mínimo 3 objetivos, 4 etapas, 3 marcos

## Menu
- \`/plan\` - Criar plano
- \`/objectives\` - Definir objetivos
- \`/roadmap\` - Criar roadmap

---
*Agente PAGIA - Gerado automaticamente*
`,
        },
        {
            id: 'code-optimizer',
            name: 'Code Optimizer',
            role: 'Especialista em Otimização e Refatoração',
            content: `# Code Optimizer

## Papel
Especialista em Otimização e Refatoração

## Descrição
Agente especializado em análise, otimização e refatoração de código para melhorar performance, legibilidade e manutenibilidade.

## Capacidades
- Análise de complexidade (Big O)
- Identificação de code smells
- Refatoração para padrões de design
- Otimização de queries e loops
- Melhoria de legibilidade
- Aplicação de princípios SOLID

## Instruções
Analise código e forneça sugestões de otimização:

1. **Resumo de Qualidade**: X/10
2. **Problemas Críticos**: Lista com soluções
3. **Melhorias Sugeridas**: Código antes/depois
4. **Código Otimizado**: Versão refatorada

Regras:
- Preserve funcionalidade
- Justifique mudanças
- Priorize por impacto

## Menu
- \`/optimize\` - Otimizar código
- \`/analyze\` - Analisar qualidade
- \`/refactor\` - Refatorar código

---
*Agente PAGIA - Gerado automaticamente*
`,
        },
    ];

    for (const agent of extraAgents) {
        const filePath = join(agentsFolder, `${agent.id}.md`);
        if (!existsSync(filePath)) {
            writeFileSync(filePath, agent.content, 'utf-8');
        }
    }
}


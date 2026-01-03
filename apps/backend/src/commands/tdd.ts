/**
 * PAGIA - TDD Command
 * Workflow de Test-Driven Development
 * 
 * @module commands/tdd
 * @author Automações Comerciais Integradas
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { join } from 'path';
import { getConfigManager } from '../core/config-manager.js';
import { testerAgent } from '../agents/specialized/tester-agent.js';
import { agentRegistry } from '../agents/agent-registry.js';
import { logger } from '../utils/logger.js';
import { writeFile, readFile, fileExists } from '../utils/file-utils.js';

export const tddCommand = new Command('tdd')
    .description('Workflow de Test-Driven Development');

// Iniciar ciclo TDD
tddCommand
    .command('start <requirement>')
    .description('Iniciar ciclo TDD para um requisito')
    .option('-l, --language <language>', 'Linguagem de programação', 'typescript')
    .option('-f, --framework <framework>', 'Framework de testes')
    .option('-o, --output <path>', 'Diretório de saída')
    .action(async (requirement, options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        // Registrar agente se não registrado
        if (!agentRegistry.has(testerAgent.id)) {
            await agentRegistry.register(testerAgent, ['tdd', 'testing']);
        }

        logger.section('🔴 Fase RED - Escrevendo Testes');

        const spinner = logger.spin('Gerando testes...');

        try {
            const result = await testerAgent.startTDD(requirement, options.language);

            spinner.succeed('Testes gerados');

            logger.box(result.content, { title: '📝 Testes Gerados', borderColor: 'red' });

            // Salvar se output especificado
            if (options.output) {
                const testFile = join(options.output, 'test.spec.ts');
                // Extrair código do resultado
                const codeMatch = result.content.match(/```(?:typescript|javascript)?\n([\s\S]*?)```/);
                if (codeMatch) {
                    writeFile(testFile, codeMatch[1]);
                    logger.keyValue('Arquivo salvo', testFile);
                }
            }

            logger.newLine();
            logger.info('Próximos passos:');
            logger.list([
                'Execute os testes - eles devem FALHAR (RED)',
                'Use `pagia tdd implement` para gerar a implementação',
                'Execute os testes novamente - devem PASSAR (GREEN)',
                'Use `pagia tdd refactor` para melhorar o código',
            ]);
        } catch (error) {
            spinner.fail('Erro ao gerar testes');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Gerar implementação
tddCommand
    .command('implement <testFile>')
    .description('Gerar implementação para fazer testes passarem')
    .option('-l, --language <language>', 'Linguagem de programação', 'typescript')
    .action(async (testFile, options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        if (!fileExists(testFile)) {
            logger.error(`Arquivo de testes não encontrado: ${testFile}`);
            process.exit(1);
        }

        const testCode = readFile(testFile);

        logger.section('🟢 Fase GREEN - Implementando');

        const spinner = logger.spin('Gerando implementação...');

        try {
            const result = await testerAgent.execute({
                prompt: `
Analise os seguintes testes e gere a implementação MÍNIMA para fazer todos passarem:

\`\`\`${options.language}
${testCode}
\`\`\`

Regras:
1. Implementação MÍNIMA - apenas o suficiente para passar os testes
2. Não adicione funcionalidades extras
3. Siga as convenções da linguagem
4. Retorne o código de implementação completo
        `,
                context: { language: options.language },
            });

            spinner.succeed('Implementação gerada');

            logger.box(result.content, { title: '💻 Implementação', borderColor: 'green' });

            logger.newLine();
            logger.info('Próximos passos:');
            logger.list([
                'Copie a implementação para seu arquivo de código',
                'Execute os testes - eles devem PASSAR',
                'Use `pagia tdd refactor` para melhorar o código',
            ]);
        } catch (error) {
            spinner.fail('Erro ao gerar implementação');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Refatorar
tddCommand
    .command('refactor <codeFile>')
    .description('Refatorar código mantendo testes verdes')
    .option('-t, --test-file <testFile>', 'Arquivo de testes para referência')
    .action(async (codeFile, options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        if (!fileExists(codeFile)) {
            logger.error(`Arquivo não encontrado: ${codeFile}`);
            process.exit(1);
        }

        const code = readFile(codeFile);
        let testCode = '';

        if (options.testFile && fileExists(options.testFile)) {
            testCode = readFile(options.testFile);
        }

        logger.section('🔵 Fase REFACTOR - Melhorando');

        const spinner = logger.spin('Refatorando código...');

        try {
            const { codeOptimizerAgent } = await import('../agents/specialized/code-optimizer.js');

            const result = await codeOptimizerAgent.refactorCode(code);

            spinner.succeed('Refatoração concluída');

            logger.box(result.content, { title: '✨ Código Refatorado', borderColor: 'blue' });

            logger.newLine();
            logger.info('Próximos passos:');
            logger.list([
                'Revise as mudanças sugeridas',
                'Execute os testes para garantir que ainda passam',
                'Repita o ciclo para novas funcionalidades',
            ]);
        } catch (error) {
            spinner.fail('Erro na refatoração');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Gerar testes para código existente
tddCommand
    .command('generate <codeFile>')
    .description('Gerar testes para código existente')
    .option('-l, --language <language>', 'Linguagem de programação', 'typescript')
    .option('-f, --framework <framework>', 'Framework de testes')
    .option('-o, --output <path>', 'Arquivo de saída')
    .action(async (codeFile, options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        if (!fileExists(codeFile)) {
            logger.error(`Arquivo não encontrado: ${codeFile}`);
            process.exit(1);
        }

        const code = readFile(codeFile);

        const spinner = logger.spin('Gerando testes...');

        try {
            const result = await testerAgent.generateTests(code, options.language, options.framework);

            spinner.succeed('Testes gerados');

            if (options.output) {
                // Extrair código
                const codeMatch = result.content.match(/```(?:typescript|javascript)?\n([\s\S]*?)```/);
                if (codeMatch) {
                    writeFile(options.output, codeMatch[1]);
                    logger.success(`Testes salvos em ${options.output}`);
                }
            } else {
                logger.box(result.content, { title: '📝 Testes Gerados', borderColor: 'cyan' });
            }
        } catch (error) {
            spinner.fail('Erro ao gerar testes');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Sugerir edge cases
tddCommand
    .command('edge-cases <codeFile>')
    .description('Sugerir edge cases para testar')
    .action(async (codeFile) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        if (!fileExists(codeFile)) {
            logger.error(`Arquivo não encontrado: ${codeFile}`);
            process.exit(1);
        }

        const code = readFile(codeFile);

        const spinner = logger.spin('Analisando edge cases...');

        try {
            const result = await testerAgent.suggestEdgeCases(code);

            spinner.succeed('Análise concluída');

            logger.box(result.content, { title: '🎯 Edge Cases Sugeridos', borderColor: 'yellow' });
        } catch (error) {
            spinner.fail('Erro na análise');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Workflow completo interativo
tddCommand
    .command('wizard')
    .description('Assistente interativo de TDD')
    .action(async () => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        logger.box(
            `${chalk.bold('Assistente TDD')}\n\n` +
            'Este assistente vai guiá-lo pelo ciclo completo de TDD:\n' +
            '1. 🔴 RED - Escrever teste que falha\n' +
            '2. 🟢 GREEN - Implementar código mínimo\n' +
            '3. 🔵 REFACTOR - Melhorar o código',
            { title: '🔄 TDD Wizard', borderColor: 'cyan' }
        );

        const { requirement, language } = await inquirer.prompt([
            {
                type: 'input',
                name: 'requirement',
                message: 'Descreva a funcionalidade que deseja implementar:',
                validate: (input) => input.trim().length > 0 || 'Requisito é obrigatório',
            },
            {
                type: 'list',
                name: 'language',
                message: 'Linguagem de programação:',
                choices: ['typescript', 'javascript', 'python', 'go', 'java'],
                default: 'typescript',
            },
        ]);

        // Executar ciclo
        logger.section('🔴 Fase 1: RED');
        const testResult = await testerAgent.startTDD(requirement, language);
        logger.box(testResult.content, { borderColor: 'red' });

        const { continueToGreen } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'continueToGreen',
                message: 'Continuar para fase GREEN (implementação)?',
                default: true,
            },
        ]);

        if (!continueToGreen) {
            logger.info('Ciclo TDD pausado. Retome quando estiver pronto.');
            return;
        }

        logger.section('🟢 Fase 2: GREEN');

        const implResult = await testerAgent.execute({
            prompt: `Implemente o código para passar os seguintes testes:\n\n${testResult.content}`,
            context: { language },
        });

        logger.box(implResult.content, { borderColor: 'green' });

        logger.success('Ciclo TDD completo! Use `pagia tdd refactor` para melhorias.');
    });

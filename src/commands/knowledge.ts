/**
 * PAGIA - Knowledge Command
 * Gerenciamento da base de conhecimento
 * 
 * @module commands/knowledge
 * @author Automações Comerciais Integradas
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { join } from 'path';
import { getConfigManager } from '../core/config-manager.js';
import { createKnowledgeBase } from '../knowledge/knowledge-base.js';
import { logger } from '../utils/logger.js';
import { formatFileSize, fileExists } from '../utils/file-utils.js';

export const knowledgeCommand = new Command('knowledge')
    .alias('kb')
    .description('Gerenciar base de conhecimento');

// Adicionar documento
knowledgeCommand
    .command('add <source>')
    .description('Adicionar arquivo ou diretório à base de conhecimento')
    .option('-r, --recursive', 'Processar diretórios recursivamente')
    .option('-t, --tags <tags>', 'Tags separadas por vírgula')
    .action(async (source, options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const kbPath = join(configManager.getPagiaFolder(), 'knowledge');
        const kb = createKnowledgeBase(kbPath);

        const spinner = logger.spin('Processando...');

        try {
            const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];

            // Verificar se é arquivo ou diretório
            const { statSync } = await import('fs');
            const stats = statSync(source);

            if (stats.isDirectory()) {
                const docs = await kb.addDirectory(source, {
                    recursive: options.recursive,
                    metadata: { tags },
                });
                spinner.succeed(`${docs.length} documento(s) adicionado(s)`);
            } else {
                const doc = await kb.addFile(source, { tags });
                spinner.succeed(`Documento "${doc.title}" adicionado`);
                logger.keyValue('ID', doc.id);
                logger.keyValue('Chunks', String(doc.chunks.length));
            }
        } catch (error) {
            spinner.fail('Erro ao adicionar documento');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Buscar
knowledgeCommand
    .command('search <query>')
    .description('Buscar na base de conhecimento')
    .option('-l, --limit <number>', 'Limite de resultados', '5')
    .option('-t, --threshold <number>', 'Threshold de similaridade', '0.3')
    .action(async (query, options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const kbPath = join(configManager.getPagiaFolder(), 'knowledge');
        const kb = createKnowledgeBase(kbPath);

        const spinner = logger.spin('Buscando...');

        try {
            const results = await kb.search(query, {
                limit: parseInt(options.limit),
                threshold: parseFloat(options.threshold),
                includeChunks: true,
            });

            spinner.stop();

            if (results.length === 0) {
                logger.info('Nenhum resultado encontrado');
                return;
            }

            logger.section(`Resultados para "${query}"`);

            for (const result of results) {
                const similarity = Math.round(result.overallSimilarity * 100);

                console.log(chalk.bold(`📄 ${result.document.title}`));
                console.log(`   Similaridade: ${chalk.green(similarity + '%')}`);
                console.log(`   Tipo: ${result.document.type}`);

                if (result.relevantChunks.length > 0) {
                    console.log(`   ${chalk.gray('Preview:')} ${result.relevantChunks[0].content.slice(0, 150)}...`);
                }

                console.log();
            }

            logger.info(`${results.length} resultado(s) encontrado(s)`);
        } catch (error) {
            spinner.fail('Erro na busca');
            logger.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Listar documentos
knowledgeCommand
    .command('list')
    .description('Listar documentos na base de conhecimento')
    .option('-t, --type <type>', 'Filtrar por tipo')
    .action(async (options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const kbPath = join(configManager.getPagiaFolder(), 'knowledge');
        const kb = createKnowledgeBase(kbPath);

        const docs = kb.list({ type: options.type });

        if (docs.length === 0) {
            logger.info('Nenhum documento na base de conhecimento');
            logger.info('Use `pagia knowledge add <arquivo>` para adicionar');
            return;
        }

        logger.section('Documentos na Base de Conhecimento');

        for (const doc of docs) {
            console.log(`  ${chalk.cyan('•')} ${doc.title} ${chalk.gray(`[${doc.type}]`)}`);
            console.log(`    ${chalk.gray('ID:')} ${doc.id}`);
            console.log(`    ${chalk.gray('Chunks:')} ${doc.chunks.length}`);
            if (doc.metadata.tags.length > 0) {
                console.log(`    ${chalk.gray('Tags:')} ${doc.metadata.tags.join(', ')}`);
            }
            console.log();
        }

        logger.info(`Total: ${docs.length} documento(s)`);
    });

// Estatísticas
knowledgeCommand
    .command('stats')
    .description('Exibir estatísticas da base de conhecimento')
    .action(async () => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const kbPath = join(configManager.getPagiaFolder(), 'knowledge');
        const kb = createKnowledgeBase(kbPath);

        const stats = kb.getStats();

        logger.section('Estatísticas da Base de Conhecimento');

        logger.keyValue('Documentos', String(stats.documentCount));
        logger.keyValue('Chunks', String(stats.chunkCount));
        logger.keyValue('Caracteres', String(stats.totalCharacters));

        if (Object.keys(stats.byType).length > 0) {
            logger.newLine();
            console.log(chalk.bold('Por tipo:'));
            for (const [type, count] of Object.entries(stats.byType)) {
                logger.keyValue(`  ${type}`, String(count));
            }
        }

        if (stats.tags.length > 0) {
            logger.newLine();
            console.log(chalk.bold('Tags:'));
            console.log(`  ${stats.tags.join(', ')}`);
        }
    });

// Remover documento
knowledgeCommand
    .command('remove <id>')
    .description('Remover documento da base de conhecimento')
    .option('-f, --force', 'Não pedir confirmação')
    .action(async (id, options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        const kbPath = join(configManager.getPagiaFolder(), 'knowledge');
        const kb = createKnowledgeBase(kbPath);

        const doc = kb.get(id);

        if (!doc) {
            logger.error(`Documento não encontrado: ${id}`);
            process.exit(1);
        }

        if (!options.force) {
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Remover "${doc.title}"?`,
                    default: false,
                },
            ]);

            if (!confirm) {
                logger.info('Operação cancelada');
                return;
            }
        }

        const deleted = await kb.delete(id);

        if (deleted) {
            logger.success(`Documento "${doc.title}" removido`);
        } else {
            logger.error('Erro ao remover documento');
        }
    });

// Limpar base
knowledgeCommand
    .command('clear')
    .description('Limpar toda a base de conhecimento')
    .option('-f, --force', 'Não pedir confirmação')
    .action(async (options) => {
        const configManager = getConfigManager();

        if (!configManager.isInitialized()) {
            logger.error('PAGIA não está inicializado.');
            process.exit(1);
        }

        if (!options.force) {
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: chalk.red('Isso removerá TODOS os documentos. Continuar?'),
                    default: false,
                },
            ]);

            if (!confirm) {
                logger.info('Operação cancelada');
                return;
            }
        }

        const kbPath = join(configManager.getPagiaFolder(), 'knowledge');
        const kb = createKnowledgeBase(kbPath);

        await kb.clear();
        logger.success('Base de conhecimento limpa');
    });

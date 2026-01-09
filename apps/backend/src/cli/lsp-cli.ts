#!/usr/bin/env node

/**
 * Comando CLI para funcionalidades LSP do PAGIA
 * Permite navegação de código estilo IDE através da linha de comando
 */

import { Command } from 'commander';
import { LSPService } from '../services/lsp-service.js';
import { LSPAgent } from '../agents/specialized/lsp-agent.js';
import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔧 Iniciando PAGIA LSP CLI...'); // Debug

const program = new Command();

program
    .name('pagia-lsp')
    .description('Ferramentas LSP para navegação e análise de código')
    .version('1.0.0');

// Comando para ir para definição
program
    .command('goto-definition')
    .description('Navegar para definição de um símbolo')
    .argument('<symbol>', 'Nome do símbolo')
    .option('-f, --file <path>', 'Arquivo onde procurar')
    .option('-p, --project <path>', 'Raiz do projeto', process.cwd())
    .action(async (symbol, options) => {
        try {
            const lspService = new LSPService(options.project);
            
            if (options.file) {
                const code = readFileSync(options.file, 'utf-8');
                const definition = await lspService.goToDefinition(symbol, options.file, code);
                console.log('📍 Definição encontrada:');
                console.log(`   Arquivo: ${definition.file}`);
                console.log(`   Linha: ${definition.line}, Coluna: ${definition.column}`);
                console.log(`   Tipo: ${definition.type}`);
                console.log(`   Assinatura: ${definition.signature}`);
                console.log(`   Contexto:\n${definition.context}`);
            } else {
                console.log('Por favor, especifique um arquivo com -f ou --file');
            }
        } catch (error) {
            console.error('❌ Erro:', (error as Error).message);
            process.exit(1);
        }
    });

// Comando para encontrar referências
program
    .command('find-references')
    .description('Encontrar todas as referências de um símbolo')
    .argument('<symbol>', 'Nome do símbolo')
    .option('-p, --project <path>', 'Raiz do projeto', process.cwd())
    .option('--extensions <exts>', 'Extensões de arquivo (padrão: .ts,.js)', '.ts,.js')
    .action(async (symbol, options) => {
        try {
            const lspService = new LSPService(options.project);
            const extensions = options.extensions.split(',');
            const projectFiles = await getAllProjectFiles(options.project, extensions);
            
            const result = await lspService.findReferences(symbol, projectFiles);
            
            console.log(`🔍 Referências encontradas para "${symbol}":`);
            console.log(`   Total: ${result.totalReferences} referências`);
            console.log(`\n📄 Referências:`);
            
            result.references.forEach((ref: any, index: number) => {
                console.log(`   ${index + 1}. ${ref.file}:${ref.line}:${ref.column}`);
                console.log(`      Tipo: ${ref.usageType}`);
                console.log(`      Contexto: ${ref.context.substring(0, 100)}...`);
                console.log('');
            });
            
            console.log(`📊 Análise de Impacto: ${result.impactAnalysis}`);
        } catch (error) {
            console.error('❌ Erro:', (error as Error).message);
            process.exit(1);
        }
    });

// Comando para informações de hover
program
    .command('hover')
    .description('Obter documentação de um símbolo')
    .argument('<symbol>', 'Nome do símbolo')
    .option('-c, --context <text>', 'Contexto do código')
    .action(async (symbol, options) => {
        try {
            const lspService = new LSPService();
            
            if (options.context) {
                const hoverInfo = await lspService.getHoverInfo(symbol, options.context);
                console.log(`ℹ️  Informações para "${symbol}":`);
                console.log(`   Assinatura: ${hoverInfo.signature}`);
                console.log(`   Documentação: ${hoverInfo.documentation}`);
                
                if (hoverInfo.parameters && hoverInfo.parameters.length > 0) {
                    console.log(`   Parâmetros:`);
                    hoverInfo.parameters.forEach((param: any) => {
                        console.log(`     ${param.name}: ${param.type} - ${param.description}`);
                    });
                }
                
                if (hoverInfo.returns) {
                    console.log(`   Retorna: ${hoverInfo.returns.type} - ${hoverInfo.returns.description}`);
                }
            } else {
                console.log('Por favor, especifique o contexto com -c ou --context');
            }
        } catch (error) {
            console.error('❌ Erro:', (error as Error).message);
            process.exit(1);
        }
    });

// Comando para análise de dependências
program
    .command('analyze-deps')
    .description('Analisar dependências de um arquivo')
    .argument('<file>', 'Arquivo para analisar')
    .action(async (file) => {
        try {
            const lspService = new LSPService();
            const analysis = await lspService.analyzeDependencies(file);
            
            console.log(`📦 Análise de dependências para ${file}:`);
            console.log(`   Imports: ${analysis.imports.length}`);
            console.log(`   Exports: ${analysis.exports.length}`);
            console.log(`   Dependências externas: ${analysis.externalDependencies.length}`);
            
            if (analysis.issues.length > 0) {
                console.log(`\n⚠️  Problemas encontrados:`);
                analysis.issues.forEach((issue: any) => console.log(`   - ${issue}`));
            }
            
            if (analysis.unusedDependencies.length > 0) {
                console.log(`\n🧹 Dependências não utilizadas:`);
                analysis.unusedDependencies.forEach((dep: any) => console.log(`   - ${dep}`));
            }
        } catch (error) {
            console.error('❌ Erro:', (error as Error).message);
            process.exit(1);
        }
    });

// Comando para busca de símbolos
program
    .command('search-symbol')
    .description('Buscar símbolos no projeto')
    .argument('<query>', 'Termo de busca')
    .option('-p, --project <path>', 'Raiz do projeto', process.cwd())
    .option('--extensions <exts>', 'Extensões de arquivo (padrão: .ts,.js)', '.ts,.js')
    .action(async (query, options) => {
        try {
            const lspService = new LSPService(options.project);
            const extensions = options.extensions.split(',');
            const symbols = await lspService.searchSymbols(query, extensions);
            
            console.log(`🔍 Resultados da busca por "${query}":`);
            console.log(`   Encontrados: ${symbols.length} símbolos`);
            
            symbols.forEach((symbol: any, index: number) => {
                console.log(`\n${index + 1}. ${symbol.symbol}`);
                console.log(`   Tipo: ${symbol.type}`);
                console.log(`   Localização: ${symbol.file}:${symbol.line}:${symbol.column}`);
                console.log(`   Assinatura: ${symbol.signature}`);
            });
        } catch (error) {
            console.error('❌ Erro:', (error as Error).message);
            process.exit(1);
        }
    });

// Função auxiliar para obter todos os arquivos do projeto
async function getAllProjectFiles(projectRoot: string, extensions: string[]): Promise<string[]> {
    const { promises: fs } = await import('fs');
    const files: string[] = [];
    
    async function walk(dir: string) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = join(dir, entry.name);
                
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    await walk(fullPath);
                } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Ignorar diretórios inacessíveis
        }
    }
    
    await walk(projectRoot);
    return files;
}

// Executar programa
program.parse();

export { program };
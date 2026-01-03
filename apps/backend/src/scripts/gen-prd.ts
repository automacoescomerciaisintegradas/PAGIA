/**
 * PAGIA - PRD Generation Script
 * Script autônomo para gerar PRDs usando o Agente Product Owner
 */

import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { createAIService } from '../core/ai-service.js';
import { getConfigManager } from '../core/config-manager.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente da raiz
dotenv.config({ path: join(process.cwd(), '.env') });

const PROVIDER_CANDIDATES = [
    { type: 'gemini', envVar: 'GEMINI_API_KEY', model: 'gemini-2.0-flash-exp' },
    { type: 'openai', envVar: 'OPENAI_API_KEY', model: 'gpt-4o' },
    { type: 'anthropic', envVar: 'ANTHROPIC_API_KEY', model: 'claude-3-5-sonnet-20241022' },
    { type: 'groq', envVar: 'GROQ_API_KEY', model: 'llama-3.3-70b-versatile' },
    { type: 'ollama', envVar: null, model: 'llama3.2' } // Fallback local sem chave
];

async function generatePRD(projectName: string, description: string) {
    const prdsDir = join(process.cwd(), '.pagia', 'docs', 'prds');
    if (!existsSync(prdsDir)) mkdirSync(prdsDir, { recursive: true });

    // Instruções do PO
    const poFile = join(process.cwd(), '.pagia', 'core', 'agents', 'product-owner.md');
    let instructions = "Você é um Product Owner experiente.";
    if (existsSync(poFile)) {
        const content = readFileSync(poFile, 'utf-8');
        const match = content.match(/## Instruções\s*\n([\s\S]+?)(?=\n## |$)/);
        if (match) instructions = match[1].trim();
    }

    const prompt = `Gere um Documento de Requisitos de Produto (PRD) de alta fidelidade para o seguinte projeto:
    Nome: ${projectName}
    Descrição: ${description}

    O documento deve ser extremamente detalhado e seguir este padrão profissional:
    
    # 📄 PRD: ${projectName}
    
    ## 🎯 1. Visão Geral & Objetivos
    - **Problema:** (O que estamos resolvendo?)
    - **Solução Proposta:** (Como resolvemos?)
    - **Objetivos Principais:** (O que queremos alcançar?)
    
    ## 👤 2. Personas & Público-Alvo
    - (Mapeamento detalhado dos usuários primários e secundários)
    
    ## 📝 3. Requisitos Funcionais (Principais Histórias de Usuário)
    - (Histórias no formato: Como [role], eu quero [feature], para que [valor])
    
    ## ⚙️ 4. Fluxo de Usuário & Experiência (UX)
    - (Passo a passo da jornada do usuário)
    
    ## 🛡️ 5. Requisitos Não-Funcionais & Segurança
    - (Performance, Privacidade, Escalabilidade)
    
    ## 🚧 6. Fora de Escopo & Riscos
    - (O que não será feito agora e potenciais gargalos)
    
    ## 📈 7. Métricas de Sucesso (KPIs)
    - (Como saberemos que o produto foi bem sucedido?)

    Gere o conteúdo em Português do Brasil com tom executivo e persuasivo.`;

    console.log(chalk.cyan(`\n🤖 [PAGIA] Iniciando geração de PRD para: ${projectName}...`));

    let generatedContent: string | null = null;
    let usedProvider = '';

    // Loop de Tentativas (Fallback Strategy)
    for (const candidate of PROVIDER_CANDIDATES) {
        // Se requer API Key e não tem ou está vazia, pula para o próximo silenciosamente
        if (candidate.envVar && (!process.env[candidate.envVar] || process.env[candidate.envVar]?.trim() === '')) {
            continue;
        }

        try {
            console.log(chalk.yellow(`\n🔄 Tentando via: ${candidate.type.toUpperCase()} (${candidate.model})...`));

            const ai = createAIService({
                type: candidate.type as any,
                apiKey: candidate.envVar ? process.env[candidate.envVar] : '',
                model: candidate.model
            });

            const response = await ai.generate(prompt, instructions);
            generatedContent = response.content;
            usedProvider = candidate.type;

            // Sucesso!
            break;
        } catch (error) {
            console.log(chalk.red(`   ❌ Falha com ${candidate.type}: ${error instanceof Error ? error.message : String(error)}`));
            console.log(chalk.gray(`   ➡️ Tentando próximo provedor...`));
        }
    }

    if (!generatedContent) {
        console.error(chalk.bgRed.white(`\n🚫 ERRO FATAL: Falha em todos os provedores de IA.`));
        console.error(chalk.red(`Verifique se você tem ao menos uma API Key válida no .env ou se o Ollama está rodando localmente.`));
        process.exit(1);
    }

    // Sucesso - Salvar arquivo
    const fileName = `prd-${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.md`;
    const filePath = join(prdsDir, fileName);

    writeFileSync(filePath, generatedContent, 'utf-8');

    console.log(chalk.green(`\n✅ PRD Gerado com sucesso usando ${usedProvider.toUpperCase()}!`));
    console.log(chalk.white(`📂 Local: ${filePath}`));

    // Exportar caminho para frontend
    console.log(`DOWNLOAD_URL: /api/download-prd?file=${fileName}`);

    return filePath;
}

// Execução imediata
const [, , name, desc] = process.argv;
if (!name) {
    console.error("Uso: npx tsx apps/backend/src/scripts/gen-prd.ts \"Nome do Projeto\" \"Descrição\"");
    process.exit(1);
}

generatePRD(name, desc || "Projeto gerado via Maestro.");

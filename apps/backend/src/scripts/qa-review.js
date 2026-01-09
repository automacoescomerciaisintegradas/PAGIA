import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { createAIService } from '../core/ai-service.js';
import { getConfigManager } from '../core/config-manager.js';
import { Logger } from '../utils/logger.js';
async function runQAReview() {
    const logger = new Logger();
    const configManager = getConfigManager();
    const config = configManager.isInitialized() ? configManager.load() : null;
    // Create AI service with config or default
    const ai = createAIService(config?.aiProvider);
    // Pegar o último PRD gerado
    const prdsDir = path.resolve('.pagia/docs/prds');
    if (!fs.existsSync(prdsDir)) {
        console.error(chalk.red('❌ Nenhum PRD encontrado para revisão.'));
        process.exit(1);
    }
    const files = fs.readdirSync(prdsDir).filter(f => f.endsWith('.md'));
    if (files.length === 0) {
        console.error(chalk.red('❌ Nenhum PRD encontrado no histórico.'));
        process.exit(1);
    }
    // Ordenar por data e pegar o mais recente
    const latestFile = files.map(f => ({
        name: f,
        time: fs.statSync(path.join(prdsDir, f)).mtime.getTime()
    })).sort((a, b) => b.time - a.time)[0].name;
    const prdPath = path.join(prdsDir, latestFile);
    const prdContent = fs.readFileSync(prdPath, 'utf8');
    console.log(chalk.green(`\n🔍 [QA] Iniciando auditoria do PRD: ${latestFile}...\n`));
    // Carregar instruções do Agente QA
    const agentPath = path.resolve('.pagia/core/agents/qa-engineer.md');
    let instructions = "";
    if (fs.existsSync(agentPath)) {
        instructions = fs.readFileSync(agentPath, 'utf8');
    }
    const prompt = `
    Como um QA Engineer Sênior, revise o seguinte PRD e forneça um relatório crítico.
    Siga as diretrizes do seu perfil:
    ${instructions}

    --- DOCUMENTO PARA REVISÃO ---
    ${prdContent}
    -----------------------------

    Gere o relatório em Markdown, focando em:
    1. Análise de Ambiguidades.
    2. Identificação de Edge Cases faltantes.
    3. Critérios de Aceite em formato Gherkin para as 3 principais funcionalidades.
    `;
    try {
        const responseConfig = await ai.generate(prompt, "Você é o QA Engineer da PAGIA.");
        const response = responseConfig.content;
        const reportName = `qa-report-${latestFile}`;
        const reportPath = path.join(prdsDir, reportName);
        fs.writeFileSync(reportPath, response);
        console.log(chalk.cyan(`\n✅ Relatório de QA Gerado: ${reportPath}`));
        console.log(chalk.yellow(`\nRESUMO DA REVISÃO:\n`));
        console.log(response.substring(0, 500) + "...");
        // Output para o dashboard capturar
        console.log(`\nDOWNLOAD_URL: /api/download-prd?file=${reportName}`);
    }
    catch (error) {
        console.error(chalk.red('\n❌ Erro na revisão de QA:'), error.message);
    }
}
runQAReview();
//# sourceMappingURL=qa-review.js.map
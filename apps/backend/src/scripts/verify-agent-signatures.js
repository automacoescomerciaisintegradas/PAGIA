/**
 * Script para verificar e relatar o status das assinaturas de agentes
 *
 * Este script verifica se todos os agentes estão usando a assinatura padrão correta
 * e gera um relatório completo do status do sistema.
 */
import { readdirSync, readFileSync } from 'fs';
import { join, extname } from 'path';
// Pastas onde os agentes podem estar localizados
const AGENTS_DIRS = [
    '../../.pagia/core/agents',
    '../guides/prompts',
    './src/agents/specialized'
];
// Assinaturas conhecidas
const SIGNATURES = {
    OLD_BMAD: '*Agente BMAD Method - Gerado pelo PAGIA*',
    NEW_BMAD: 'PAGIA - Gerado pelo Agente BMAD Method | claude code | Gemini |',
    GENERIC_OLD: '*Agente criado em ',
    CUSTOM: [
        '*Gerado pelo PAGIA v',
        '<!-- PAGIA-BUNDLE-START -->',
        '*Agente BMAD Method*'
    ]
};
function detectSignature(content) {
    // Verificar variações da assinatura nova BMAD primeiro
    if (content.includes('PAGIA - Gerado pelo Agente BMAD Method')) {
        // Procurar a assinatura específica no conteúdo
        const targetSignatures = [
            'PAGIA - Gerado pelo Agente BMAD Method | claude code | Gemini |',
            'PAGIA - Gerado pelo Agente BMAD Method | claude code | Gemini',
            'PAGIA - Gerado pelo Agente BMAD Method | claude code',
            'PAGIA - Gerado pelo Agente BMAD Method'
        ];
        for (const targetSig of targetSignatures) {
            if (content.includes(targetSig)) {
                return { signature: targetSig, type: 'CORRECT' };
            }
        }
    }
    // Verificar assinatura nova BMAD exata
    if (content.includes(SIGNATURES.NEW_BMAD)) {
        return { signature: SIGNATURES.NEW_BMAD, type: 'CORRECT' };
    }
    // Verificar assinatura antiga BMAD
    if (content.includes(SIGNATURES.OLD_BMAD)) {
        return { signature: SIGNATURES.OLD_BMAD, type: 'OLD' };
    }
    // Verificar assinatura genérica antiga
    if (content.includes(SIGNATURES.GENERIC_OLD)) {
        const match = content.match(/\*Agente criado em [^\*]+\*/);
        return { signature: match ? match[0] : SIGNATURES.GENERIC_OLD, type: 'GENERIC' };
    }
    // Verificar assinaturas customizadas
    for (const customSig of SIGNATURES.CUSTOM) {
        if (content.includes(customSig)) {
            const lines = content.split('\n');
            const sigLine = lines.find(line => line.includes(customSig)) || customSig;
            return { signature: sigLine.trim(), type: 'CUSTOM' };
        }
    }
    // Nenhuma assinatura encontrada
    return { signature: 'Nenhuma assinatura encontrada', type: 'NONE' };
}
function verifyDirectory(dirPath) {
    const reports = [];
    try {
        const files = readdirSync(dirPath);
        for (const file of files) {
            const fileExt = extname(file);
            if (fileExt === '.md') {
                const filePath = join(dirPath, file);
                try {
                    const content = readFileSync(filePath, 'utf-8');
                    const stats = { size: Buffer.byteLength(content, 'utf-8') };
                    const { signature, type } = detectSignature(content);
                    reports.push({
                        fileName: file,
                        path: filePath,
                        signature: signature.substring(0, 60) + (signature.length > 60 ? '...' : ''),
                        status: type,
                        size: stats.size
                    });
                }
                catch (error) {
                    console.log(`❌ Erro ao ler arquivo ${filePath}: ${error}`);
                }
            }
        }
    }
    catch (error) {
        console.log(`❌ Erro ao acessar diretório ${dirPath}: ${error}`);
    }
    return reports;
}
function generateReport(reports) {
    const report = {
        totalAgents: reports.length,
        correctSignatures: 0,
        oldSignatures: 0,
        genericSignatures: 0,
        customSignatures: 0,
        noSignature: 0,
        agentsByStatus: {},
        directoriesChecked: AGENTS_DIRS
    };
    // Contar por status
    for (const agent of reports) {
        switch (agent.status) {
            case 'CORRECT':
                report.correctSignatures++;
                break;
            case 'OLD':
                report.oldSignatures++;
                break;
            case 'GENERIC':
                report.genericSignatures++;
                break;
            case 'CUSTOM':
                report.customSignatures++;
                break;
            case 'NONE':
                report.noSignature++;
                break;
        }
        if (!report.agentsByStatus[agent.status]) {
            report.agentsByStatus[agent.status] = [];
        }
        report.agentsByStatus[agent.status].push(agent);
    }
    return report;
}
function printReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('RELATÓRIO DE VERIFICAÇÃO DE ASSINATURAS DE AGENTES');
    console.log('='.repeat(60));
    console.log(`\n📊 ESTATÍSTICAS GERAIS:`);
    console.log(`Total de agentes encontrados: ${report.totalAgents}`);
    console.log(`✅ Assinaturas corretas (nova BMAD): ${report.correctSignatures}`);
    console.log(`❌ Assinaturas antigas (BMAD antiga): ${report.oldSignatures}`);
    console.log(`📝 Assinaturas genéricas: ${report.genericSignatures}`);
    console.log(`🔧 Assinaturas customizadas: ${report.customSignatures}`);
    console.log(`⚠️  Sem assinatura: ${report.noSignature}`);
    // Calcular percentual
    const compliance = report.totalAgents > 0 ?
        ((report.correctSignatures / report.totalAgents) * 100).toFixed(1) : '0';
    console.log(`\n📈 Taxa de conformidade: ${compliance}%`);
    // Detalhes por status
    if (report.agentsByStatus['OLD'] && report.agentsByStatus['OLD'].length > 0) {
        console.log(`\n🔍 AGENTES COM ASSINATURA ANTIGA:`);
        for (const agent of report.agentsByStatus['OLD']) {
            console.log(`  • ${agent.fileName} (${agent.path})`);
        }
    }
    if (report.agentsByStatus['NONE'] && report.agentsByStatus['NONE'].length > 0) {
        console.log(`\n⚠️  AGENTES SEM ASSINATURA:`);
        for (const agent of report.agentsByStatus['NONE']) {
            console.log(`  • ${agent.fileName} (${agent.path})`);
        }
    }
    if (report.agentsByStatus['CUSTOM'] && report.agentsByStatus['CUSTOM'].length > 0) {
        console.log(`\n🔧 AGENTES COM ASSINATURAS CUSTOMIZADAS:`);
        for (const agent of report.agentsByStatus['CUSTOM']) {
            console.log(`  • ${agent.fileName}: ${agent.signature}`);
        }
    }
    console.log(`\n📁 DIRETÓRIOS VERIFICADOS:`);
    for (const dir of report.directoriesChecked) {
        console.log(`  • ${dir}`);
    }
    console.log('\n' + '='.repeat(60));
    // Recomendações
    if (report.oldSignatures > 0) {
        console.log(`\n💡 RECOMENDAÇÃO: Execute o script de atualização para corrigir ${report.oldSignatures} agentes`);
        console.log(`   Comando: npm run update-agent-signatures`);
    }
    if (report.correctSignatures === report.totalAgents) {
        console.log(`\n🎉 TODOS OS AGENTES ESTÃO USANDO A ASSINATURA PADRÃO CORRETA!`);
    }
}
// Execução principal
console.log('🔍 Iniciando verificação de assinaturas de agentes...\n');
const allReports = [];
for (const dir of AGENTS_DIRS) {
    console.log(`📂 Verificando diretório: ${dir}`);
    const dirReports = verifyDirectory(dir);
    allReports.push(...dirReports);
    console.log(`   Encontrados: ${dirReports.length} agentes`);
}
const finalReport = generateReport(allReports);
printReport(finalReport);
// Exit code baseado no resultado
if (finalReport.oldSignatures > 0) {
    process.exit(1); // Falha se houver assinaturas antigas
}
else {
    process.exit(0); // Sucesso se tudo estiver correto
}
//# sourceMappingURL=verify-agent-signatures.js.map
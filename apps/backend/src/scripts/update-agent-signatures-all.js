/**
 * Script para atualizar assinaturas nos arquivos de agentes
 *
 * Este script atualiza a assinatura em todos os arquivos .md de agentes
 * do formato antigo para o novo formato solicitado pelo usuário.
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
// Pastas onde os agentes podem estar localizados
const AGENTS_DIRS = [
    './.pagia/core/agents',
    './guides/prompts',
];
// Assinatura antiga e nova
const OLD_SIGNATURE = '*Agente BMAD Method - Gerado pelo PAGIA*';
const NEW_SIGNATURE = 'PAGIA - Gerado pelo Agente BMAD Method | claude code | Gemini |';
// Extensões de arquivo para processar
const FILE_EXTENSIONS = ['.md'];
console.log('Iniciando atualização de assinaturas nos agentes...');
let updatedFiles = 0;
let totalFiles = 0;
// Processar cada diretório
for (const dir of AGENTS_DIRS) {
    try {
        console.log(`\\nProcessando diretório: ${dir}`);
        // Ler todos os arquivos no diretório
        const files = readdirSync(dir);
        for (const file of files) {
            const fileExt = extname(file);
            if (FILE_EXTENSIONS.includes(fileExt)) {
                totalFiles++;
                const filePath = join(dir, file);
                try {
                    // Ler o conteúdo do arquivo
                    let content = readFileSync(filePath, 'utf-8');
                    // Verificar se contém a assinatura antiga
                    if (content.includes(OLD_SIGNATURE)) {
                        // Substituir a assinatura antiga pela nova
                        const newContent = content.replace(new RegExp(OLD_SIGNATURE.replace(/[.*+?^${}()|[\\]/g, '\$&'), 'g'), NEW_SIGNATURE);
                        // Escrever o conteúdo atualizado de volta ao arquivo
                        writeFileSync(filePath, newContent, 'utf-8');
                        console.log(`✓ Atualizado: ${file}`);
                        updatedFiles++;
                    }
                    else {
                        console.log(`- Nenhuma alteração necessária: ${file}`);
                    }
                }
                catch (error) {
                    console.error(`✗ Erro ao processar ${file}:`, error.message);
                }
            }
        }
    }
    catch (error) {
        console.error(`✗ Erro ao acessar diretório ${dir}:`, error.message);
    }
}
// Processar arquivos específicos na raiz que contenham "agent" no nome
try {
    const rootFiles = ['AGENTS.md'];
    for (const file of rootFiles) {
        try {
            const stats = require('fs').statSync(file);
            if (stats.isFile()) {
                totalFiles++;
                const content = readFileSync(file, 'utf-8');
                if (content.includes(OLD_SIGNATURE)) {
                    const newContent = content.replace(new RegExp(OLD_SIGNATURE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_SIGNATURE);
                    writeFileSync(file, newContent, 'utf-8');
                    console.log(`✓ Atualizado: ${file}`);
                    updatedFiles++;
                }
                else {
                    console.log(`- Nenhuma alteração necessária: ${file}`);
                }
            }
        }
        catch (error) {
            // Arquivo não existe, não é um erro
        }
    }
}
catch (error) {
    console.error('Erro ao processar arquivos na raiz:', error.message);
}
console.log(`\\nResumo:`);
console.log(`- Arquivos processados: ${totalFiles}`);
console.log(`- Arquivos atualizados: ${updatedFiles}`);
console.log(`- Assinatura antiga: "${OLD_SIGNATURE}"`);
console.log(`- Nova assinatura: "${NEW_SIGNATURE}"`);
//# sourceMappingURL=update-agent-signatures-all.js.map
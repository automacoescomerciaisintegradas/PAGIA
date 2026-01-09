/**
 * Script para atualizar assinaturas nos arquivos de agentes
 *
 * Este script atualiza a assinatura em todos os arquivos .md de agentes
 * do formato antigo para o novo formato solicitado pelo usuário.
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
// Pasta onde os agentes estão localizados
const AGENTS_DIR = './.pagia/core/agents';
// Assinatura antiga e nova
const OLD_SIGNATURE = '*Agente BMAD Method - Gerado pelo PAGIA*';
const NEW_SIGNATURE = 'PAGIA - Gerado pelo Agente BMAD Method | claude code | Gemini |';
// Extensões de arquivo para processar
const FILE_EXTENSIONS = ['.md'];
console.log('Iniciando atualização de assinaturas nos agentes...');
// Ler todos os arquivos na pasta de agentes
const files = readdirSync(AGENTS_DIR);
let updatedFiles = 0;
let totalFiles = 0;
for (const file of files) {
    const ext = getFileExtension(file);
    if (FILE_EXTENSIONS.includes(ext)) {
        totalFiles++;
        const filePath = join(AGENTS_DIR, file);
        try {
            // Ler o conteúdo do arquivo
            let content = readFileSync(filePath, 'utf-8');
            // Verificar se contém a assinatura antiga
            if (content.includes(OLD_SIGNATURE)) {
                // Substituir a assinatura antiga pela nova
                const newContent = content.replace(new RegExp(OLD_SIGNATURE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_SIGNATURE);
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
console.log(`\nResumo:`);
console.log(`- Arquivos processados: ${totalFiles}`);
console.log(`- Arquivos atualizados: ${updatedFiles}`);
console.log(`- Assinatura antiga: "${OLD_SIGNATURE}"`);
console.log(`- Nova assinatura: "${NEW_SIGNATURE}"`);
function getFileExtension(filename) {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex);
}
//# sourceMappingURL=update-agent-signatures.js.map
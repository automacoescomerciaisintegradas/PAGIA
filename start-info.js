#!/usr/bin/env node

// Script de inicialização do PAGIA com persistência de sessões
import fs from 'fs';
import path from 'path';

// Configurar ambiente
const PAGIA_DIR = path.resolve(process.cwd(), '.pagia');
const SESSIONS_DIR = path.join(PAGIA_DIR, 'sessions');

// Criar diretórios necessários
if (!fs.existsSync(PAGIA_DIR)) {
    fs.mkdirSync(PAGIA_DIR, { recursive: true });
}
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

console.log('=== PAGIA - Sistema de Terminal Persistente ===');
console.log('Diretório de sessões:', SESSIONS_DIR);

// Verificar se há sessões existentes
const sessionFiles = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'));
console.log('Sessões existentes:', sessionFiles.length);

if (sessionFiles.length > 0) {
    console.log('Sessões disponíveis:');
    sessionFiles.forEach((file, index) => {
        const sessionName = file.replace('.json', '');
        const content = JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, file), 'utf8'));
        console.log(`  ${index + 1}. ${sessionName} (${content.length} mensagens)`);
    });
}

console.log('\nPara iniciar o terminal interativo, execute:');
console.log('  npx tsx src/cli.ts chat');
console.log('\nOu para usar o terminal persistente:');
console.log('  node pagia-terminal.js');
console.log('\nCertifique-se de ter configurado sua GEMINI_API_KEY no arquivo .env');

// Verificar configuração de API
import 'dotenv/config';
if (process.env.GEMINI_API_KEY) {
    console.log('\n✓ API Key configurada');
} else {
    console.log('\n⚠ GEMINI_API_KEY não configurada - funcionalidade de IA limitada');
    console.log('Obtenha uma chave em: https://aistudio.google.com/app/apikey');
    console.log('Adicione ao arquivo .env: GEMINI_API_KEY=sua_chave_aqui');
}
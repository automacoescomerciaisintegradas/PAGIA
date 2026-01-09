#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obter o diretório do script atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminho para o CLI do PAGIA
const cliPath = join(__dirname, 'src', 'cli.ts');

console.log('Tentando executar PAGIA CLI diretamente...');

// Tentar executar com tsx
const child = spawn('npx', ['tsx', cliPath, 'chat'], {
    stdio: 'inherit',
    cwd: __dirname
});

child.on('error', (error) => {
    console.error('Erro ao iniciar processo:', error.message);
});

child.on('close', (code) => {
    console.log(`Processo encerrado com código: ${code}`);
});
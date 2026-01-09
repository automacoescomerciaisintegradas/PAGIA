#!/usr/bin/env node

/**
 * Wrapper para manter PAGIA CLI ativo
 * Evita o encerramento automático após comandos
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔧 PAGIA CLI Wrapper - Terminal Persistente');
console.log('Digite seus comandos ou "sair" para encerrar\n');

function processCommand(command) {
    if (command.toLowerCase() === 'sair' || command.toLowerCase() === 'exit') {
        console.log('👋 Até logo!');
        rl.close();
        return;
    }

    const child = spawn('pagia', ['chat'], {
        stdio: ['pipe', 'inherit', 'inherit']
    });

    child.stdin.write(command + '\n');
    child.stdin.end();

    child.on('close', () => {
        console.log('\n'); // Espaçamento
        rl.question('PAGIA> ', processCommand);
    });
}

rl.question('PAGIA> ', processCommand);
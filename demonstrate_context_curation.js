#!/usr/bin/env node

/**
 * Demonstração da funcionalidade de Curadoria de Contexto do PAGIA
 * 
 * Este script demonstra como usar os novos comandos de curadoria de contexto
 * para organizar e pesquisar informações no projeto.
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

async function demonstrateContextCuration() {
  console.log('🎨 Demonstração: Curadoria de Contexto no PAGIA');
  console.log('=' .repeat(50));
  
  // Criar um diretório temporário para testes
  const demoDir = path.join(process.cwd(), 'demo-context');
  await fs.mkdir(demoDir, { recursive: true });
  
  // Criar alguns arquivos de exemplo
  await fs.writeFile(
    path.join(demoDir, 'exemplo-documentacao.md'),
    `# Documentação de Exemplo

Este é um arquivo de documentação de exemplo para demonstrar a curadoria de contexto.

## Seções
- Introdução
- Instalação
- Uso
`
  );
  
  await fs.writeFile(
    path.join(demoDir, 'exemplo-codigo.ts'),
    `// Exemplo de código para demonstração
interface Usuario {
  nome: string;
  email: string;
}

function criarUsuario(nome: string, email: string): Usuario {
  return { nome, email };
}

export { criarUsuario, Usuario };
`
  );
  
  await fs.writeFile(
    path.join(demoDir, 'exemplo-teste.spec.ts'),
    `// Exemplo de teste para demonstração
import { criarUsuario } from './exemplo-codigo';

describe('Função criarUsuario', () => {
  it('deve criar um usuário com nome e email', () => {
    const usuario = criarUsuario('João', 'joao@example.com');
    expect(usuario.nome).toBe('João');
    expect(usuario.email).toBe('joao@example.com');
  });
});
`
  );
  
  console.log('\n✅ Arquivos de exemplo criados:');
  console.log('- exemplo-documentacao.md (documentação)');
  console.log('- exemplo-codigo.ts (código)');
  console.log('- exemplo-teste.spec.ts (teste)');
  
  console.log('\n🔍 Passo 1: Construindo a árvore de contexto...');
  await runPagiaCommand(['context', 'build-tree', demoDir, '*.md', '*.ts']);
  
  console.log('\n🔍 Passo 2: Pesquisando na árvore de contexto...');
  await runPagiaCommand(['context', 'search', 'usuário']);
  
  console.log('\n🔍 Passo 3: Adicionando um documento específico...');
  await runPagiaCommand(['context', 'add-document', path.join(demoDir, 'exemplo-documentacao.md'), 'documentation']);
  
  console.log('\n🔍 Passo 4: Pesquisando novamente após adição...');
  await runPagiaCommand(['context', 'search', 'documentação']);
  
  console.log('\n🎉 Demonstração concluída!');
  console.log('\n📝 Resumo dos comandos utilizados:');
  console.log('   pagia context build-tree [diretório] [padrões...]');
  console.log('   pagia context search <consulta>');
  console.log('   pagia context add-document <arquivo> [categoria]');
  
  console.log('\n📋 A árvore de contexto foi salva em .pagia/context-tree.json');
  console.log('   Esta estrutura hierárquica ajuda a IA a entender melhor o projeto.');
  
  // Limpar arquivos de demonstração
  try {
    await fs.rm(demoDir, { recursive: true, force: true });
    console.log('\n🧹 Diretório de demonstração removido.');
  } catch (error) {
    console.warn('⚠️  Não foi possível remover o diretório de demonstração:', error.message);
  }
}

function runPagiaCommand(args) {
  return new Promise((resolve) => {
    const child = spawn('node', ['src/cli.ts', ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (output.trim()) {
        console.log('   Saída:', output.trim().replace(/\n/g, '\n   '));
      }
      if (errorOutput.trim()) {
        console.log('   Erros:', errorOutput.trim().replace(/\n/g, '\n   '));
      }
      resolve({ code, output, errorOutput });
    });
  });
}

// Executar demonstração
demonstrateContextCuration().catch(console.error);
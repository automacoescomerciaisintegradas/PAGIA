#!/usr/bin/env node

/**
 * Demonstração das funcionalidades avançadas de Curadoria de Contexto do PAGIA
 * 
 * Este script demonstra os novos recursos de indexação semântica, 
 * filtragem avançada e metadados enriquecidos.
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

async function demonstrateAdvancedContextCuration() {
  console.log('🎨 Demonstração: Recursos Avançados de Curadoria de Contexto no PAGIA');
  console.log('=' .repeat(70));
  
  // Criar um diretório temporário para testes
  const demoDir = path.join(process.cwd(), 'advanced-demo-context');
  await fs.mkdir(demoDir, { recursive: true });
  
  // Criar arquivos de exemplo com diferentes temas
  await fs.writeFile(
    path.join(demoDir, 'autenticacao.ts'),
    `// Sistema de autenticação do usuário
interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
}

class AuthService {
  // Método para autenticar um usuário
  async authenticate(email: string, senha: string): Promise<Usuario | null> {
    // Lógica de autenticação
    return null;
  }
  
  // Método para autorizar acesso
  async authorize(usuario: Usuario, recurso: string): Promise<boolean> {
    // Lógica de autorização
    return true;
  }
}

export { AuthService, Usuario };
`
  );
  
  await fs.writeFile(
    path.join(demoDir, 'gerenciamento-usuarios.md'),
    `# Sistema de Gerenciamento de Usuários

Este documento descreve o sistema de gerenciamento de usuários da aplicação.

## Funcionalidades

- Cadastro de novos usuários
- Edição de perfil
- Remoção de contas
- Recuperação de senha

## Componentes

O sistema é composto pelos seguintes módulos:

- Interface de cadastro
- Validação de dados
- Armazenamento seguro
- Notificações
`
  );
  
  await fs.writeFile(
    path.join(demoDir, 'configuracao-seguranca.json'),
    `{
  "security": {
    "jwt": {
      "secret": "super-secret-key",
      "expiresIn": "24h"
    },
    "bcrypt": {
      "saltRounds": 12
    },
    "rateLimiting": {
      "windowMs": 900000,
      "max": 100
    }
  }
}`
  );
  
  await fs.writeFile(
    path.join(demoDir, 'testes-autenticacao.spec.ts'),
    `// Testes para o sistema de autenticação
import { AuthService } from './autenticacao';

describe('Serviço de Autenticação', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  it('deve autenticar um usuário válido', async () => {
    const resultado = await authService.authenticate('usuario@teste.com', 'senha123');
    expect(resultado).toBeDefined();
  });

  it('não deve autenticar um usuário inválido', async () => {
    const resultado = await authService.authenticate('invalido@teste.com', 'senha');
    expect(resultado).toBeNull();
  });
});
`
  );
  
  console.log('\n✅ Arquivos de exemplo criados:');
  console.log('- autenticacao.ts (código de autenticação)');
  console.log('- gerenciamento-usuarios.md (documentação de usuários)');
  console.log('- configuracao-seguranca.json (configuração de segurança)');
  console.log('- testes-autenticacao.spec.ts (testes de autenticação)');
  
  console.log('\n🔍 Passo 1: Construindo a árvore de contexto...');
  await runPagiaCommand(['context', 'build-tree', demoDir, '*.ts', '*.md', '*.json']);
  
  console.log('\n📊 Passo 2: Verificando estatísticas...');
  await runPagiaCommand(['context', 'stats']);
  
  console.log('\n🔍 Passo 3: Busca tradicional por "autenticação"...');
  await runPagiaCommand(['context', 'search', 'autenticação']);
  
  console.log('\n🧠 Passo 4: Busca semântica por "login de usuário" (mesmo não estando exatamente escrito)...');
  await runPagiaCommand(['context', 'semantic-search', 'login de usuário']);
  
  console.log('\n🧠 Passo 5: Busca semântica por "gerenciamento de perfis" (relacionado a usuários)...');
  await runPagiaCommand(['context', 'semantic-search', 'gerenciamento de perfis']);
  
  console.log('\n🏷️  Passo 6: Adicionando um documento importante com tags...');
  await runPagiaCommand(['context', 'add-document', path.join(demoDir, 'autenticacao.ts'), 'code', 'critical,security,auth']);
  
  console.log('\n🔍 Passo 7: Filtrando por documentos com tag "security"...');
  await runPagiaCommand(['context', 'filter', 'file', 'security']);
  
  console.log('\n🔍 Passo 8: Filtrando por documentos de código...');
  await runPagiaCommand(['context', 'filter', 'code']);
  
  console.log('\n🎉 Demonstração das funcionalidades avançadas concluída!');
  
  console.log('\n📝 Recursos demonstrados:');
  console.log('   • Indexação semântica com embeddings');
  console.log('   • Busca semântica para encontrar conteúdo relacionado');
  console.log('   • Sistema de tags para categorização avançada');
  console.log('   • Filtragem por tipo, tag e prioridade');
  console.log('   • Estatísticas detalhadas da árvore de contexto');
  
  console.log('\n📋 Comandos utilizados:');
  console.log('   pagia context semantic-search <consulta>');
  console.log('   pagia context add-document <arquivo> [categoria] [tags]');
  console.log('   pagia context filter [tipo] [tag] [prioridade]');
  console.log('   pagia context stats');
  
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
demonstrateAdvancedContextCuration().catch(console.error);
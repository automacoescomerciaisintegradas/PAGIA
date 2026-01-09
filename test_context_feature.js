#!/usr/bin/env node

// Script para testar a nova funcionalidade de curadoria de contexto no PAGIA

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

async function testContextCuration() {
  console.log('Testing PAGIA Context Curation Feature...\n');
  
  // First, let's make sure we have the .pagia directory
  try {
    await fs.mkdir(path.join(process.cwd(), '.pagia'), { recursive: true });
    console.log('✓ .pagia directory ensured');
  } catch (error) {
    console.error('✗ Error ensuring .pagia directory:', error.message);
    return;
  }
  
  // Test 1: Build context tree
  console.log('\n1. Testing build-tree command...');
  await runPagiaCommand(['context', 'build-tree', '.', '*.ts', '*.js', '*.md']);
  
  // Test 2: Search in context tree
  console.log('\n2. Testing search command...');
  await runPagiaCommand(['context', 'search', 'context']);
  
  // Test 3: Add a document to context tree
  console.log('\n3. Testing add-document command...');
  // Create a test document first
  const testDocPath = path.join(process.cwd(), 'test_document.md');
  await fs.writeFile(testDocPath, '# Test Document\nThis is a test document for context curation.');
  
  await runPagiaCommand(['context', 'add-document', 'test_document.md', 'documentation']);
  
  console.log('\n✓ All context curation tests completed!');
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
      if (output) {
        console.log('Output:', output.trim());
      }
      if (errorOutput) {
        console.log('Errors:', errorOutput.trim());
      }
      resolve({ code, output, errorOutput });
    });
  });
}

// Run the test
testContextCuration().catch(console.error);
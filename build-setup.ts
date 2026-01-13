#!/usr/bin/env node

/**
 * Simple build script for PAGIA CLI
 * Copies and prepares files for distribution
 */

import { cpSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const srcDir = 'apps/backend/src';
const distDir = 'dist';

// Ensure dist directory exists
if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
}

// Copy main index file
console.log('Copying main index file...');
cpSync(join(srcDir, 'index.ts'), join(distDir, 'index.ts'));

// Copy CLI files that are referenced
const cliFiles = [
    'commands/chat.ts',
    'commands/agent.ts',
    'commands/init.ts',
    'commands/plan.ts',
    'utils/logger.ts',
    'core/config-manager.ts'
];

console.log('Copying CLI command files...');
for (const file of cliFiles) {
    const srcPath = join(srcDir, file);
    const destPath = join(distDir, file);
    
    // Create directory structure (Windows compatible)
    const destDir = dirname(destPath);
    if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
    }
    
    if (existsSync(srcPath)) {
        cpSync(srcPath, destPath);
        console.log(`  ✓ ${file}`);
    } else {
        console.log(`  ✗ ${file} (not found)`);
    }
}

console.log('\nBuild preparation complete!');
console.log('Now run: npm run build');
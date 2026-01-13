#!/usr/bin/env node

/**
 * PAGIA REPL (Read-Eval-Print Loop)
 * Interactive command-line interface for PAGIA framework
 */

import { Command } from 'commander';
import chalk from 'chalk';
import readline from 'readline';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Import PAGIA CLI core modules
import { Engine } from '../apps/backend/src/cli-core/Engine.js';

interface ReplOptions {
  provider?: string;
  model?: string;
  debug?: boolean;
}

class PAGIARepl {
  private engine: Engine;
  private rl: readline.Interface;
  private options: ReplOptions;

  constructor(options: ReplOptions = {}) {
    this.options = options;
    
    // Create a simple command handler
    const commandHandler = async (input: string) => {
      await this.processCommand(input);
    };

    this.engine = new Engine(commandHandler, chalk.blue('pagia> '));
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle Ctrl+C gracefully
    this.rl.on('SIGINT', () => {
      console.log('\n' + chalk.yellow('Use "exit" or "quit" to leave the REPL.'));
      this.engine['renderPrompt'](); // Access private method
    });

    this.rl.on('close', () => {
      this.exit();
    });
  }

  private showWelcome(): void {
    console.log(chalk.green.bold('\n=== PAGIA REPL ==='));
    console.log(chalk.gray('PAGIA - Plano de Ação de Gestão e Implementação com IA'));
    console.log(chalk.gray('Type "help" for available commands or "exit" to quit.\n'));
  }

  private showHelp(): void {
    console.log('\nAvailable commands:');
    console.log(chalk.cyan('  help') + '           - Show this help message');
    console.log(chalk.cyan('  exit/quit') + '      - Exit the REPL');
    console.log(chalk.cyan('  load <file>') + '    - Load and execute a JavaScript/TypeScript file');
    console.log(chalk.cyan('  <any text>') + '     - Send text to PAGIA for processing\n');
  }

  private async loadFile(filePath: string): Promise<void> {
    try {
      const fullPath = join(process.cwd(), filePath);
      
      if (!existsSync(fullPath)) {
        console.log(chalk.red(`File not found: ${filePath}`));
        return;
      }

      const content = readFileSync(fullPath, 'utf-8');
      console.log(chalk.gray(`Loaded file: ${filePath}`));
      
      // Process the file content
      await this.processCommand(content);
      
    } catch (error) {
      console.log(chalk.red(`Error loading file: ${(error as Error).message}`));
    }
  }

  private async processCommand(command: string): Promise<void> {
    try {
      if (this.options.debug) {
        console.log(chalk.gray(`Processing: ${command}`));
      }

      // Simple command routing
      const trimmed = command.trim().toLowerCase();
      
      if (trimmed === 'help') {
        this.showHelp();
        return;
      }

      if (trimmed === 'exit' || trimmed === 'quit') {
        this.exit();
        return;
      }

      if (trimmed.startsWith('load ')) {
        await this.loadFile(command.substring(5).trim());
        return;
      }

      // For now, just echo the command (placeholder for actual PAGIA processing)
      console.log(chalk.green('Received:'));
      console.log(command);
      
      // TODO: Integrate with actual PAGIA engine when available
      console.log(chalk.yellow('[PAGIA Engine Integration Placeholder]'));

    } catch (error) {
      console.log(chalk.red(`Error: ${(error as Error).message}`));
    }
  }

  private exit(): void {
    console.log(chalk.yellow('\nGoodbye!'));
    this.rl.close();
    process.exit(0);
  }

  public start(): void {
    this.showWelcome();
    this.engine.start();
  }
}

// CLI setup
const program = new Command();

program
  .name('pagia-repl')
  .description('Interactive REPL for PAGIA framework')
  .option('-p, --provider <provider>', 'AI provider to use')
  .option('-m, --model <model>', 'Specific model to use')
  .option('-d, --debug', 'Enable debug mode')
  .action((options: ReplOptions) => {
    const repl = new PAGIARepl(options);
    repl.start();
  });

program.parse();
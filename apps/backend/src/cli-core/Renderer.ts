/**
 * PAGIA CLI Renderer
 * Renderização consistente de blocos de texto
 */

import chalk from 'chalk';

export class Renderer {
    static block(title: string, content: string) {
        console.log('');
        console.log(chalk.cyan(`┌─ ${title.toUpperCase()} ${'─'.repeat(Math.max(0, 50 - title.length))}`));
        const lines = content.split('\n');
        for (const line of lines) {
            console.log(chalk.gray('│ ') + line);
        }
        console.log(chalk.cyan('└' + '─'.repeat(52)));
        console.log('');
    }

    static error(message: string) {
        console.log('');
        console.log(chalk.red(`❌ ${message}`));
        console.log('');
    }

    static success(message: string) {
        console.log('');
        console.log(chalk.green(`✅ ${message}`));
        console.log('');
    }

    static info(message: string) {
        console.log(chalk.gray(`ℹ️  ${message}`));
    }

    static spinner(text: string): { stop: () => void; update: (text: string) => void } {
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;
        const interval = setInterval(() => {
            process.stdout.write(`\r${chalk.cyan(frames[i++ % frames.length])} ${text}`);
        }, 80);

        return {
            stop: () => {
                clearInterval(interval);
                process.stdout.write('\r' + ' '.repeat(text.length + 5) + '\r');
            },
            update: (newText: string) => {
                text = newText;
            }
        };
    }
}

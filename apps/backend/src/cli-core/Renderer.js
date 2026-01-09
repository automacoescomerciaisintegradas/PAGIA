/**
 * PAGIA CLI Renderer
 * Renderização consistente de blocos de texto
 */
import chalk from 'chalk';
export class Renderer {
    static block(title, content) {
        console.log('');
        console.log(chalk.cyan(`┌─ ${title.toUpperCase()} ${'─'.repeat(Math.max(0, 50 - title.length))}`));
        const lines = content.split('\n');
        for (const line of lines) {
            console.log(chalk.gray('│ ') + line);
        }
        console.log(chalk.cyan('└' + '─'.repeat(52)));
        console.log('');
    }
    static error(message) {
        console.log('');
        console.log(chalk.red(`❌ ${message}`));
        console.log('');
    }
    static success(message) {
        console.log('');
        console.log(chalk.green(`✅ ${message}`));
        console.log('');
    }
    static info(message) {
        console.log(chalk.gray(`ℹ️  ${message}`));
    }
    static spinner(text) {
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
            update: (newText) => {
                text = newText;
            }
        };
    }
}
//# sourceMappingURL=Renderer.js.map
import readline from 'readline';

export function createPrompt(onLine: (input: string) => void) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.setPrompt('> ');
    rl.prompt();

    rl.on('line', (line) => {
        onLine(line.trim());
        rl.prompt();
    });
}

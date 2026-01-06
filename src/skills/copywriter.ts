import { Skill } from './types.js';
import { runGemini } from '../gemini/runner.js';

export const copywriter: Skill = {
    name: 'copywriter',
    description: 'Especialista em copywriting e persuasão',

    async run(ctx) {
        const prompt = `
Você é um copywriter especialista em conversão.
Use gatilhos mentais, clareza e CTA.

Input:
${ctx.input}
    `.trim();

        return await runGemini(prompt);
    },
};

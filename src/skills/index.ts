import { Skill } from './types.js';
import { copywriter } from './copywriter.js';

// Re-export type
export type { Skill } from './types.js';

const registry: Record<string, Skill> = {
    'echo': {
        name: 'echo',
        description: 'Echoes the input back to the user',
        run: async ({ input }) => `Echo Skill Output: ${input}`
    },
    'reverse': {
        name: 'reverse',
        description: 'Reverses the input string',
        run: async ({ input }) => input.split('').reverse().join('')
    },
    // Register imported skills
    [copywriter.name]: copywriter
};

export function getSkill(name: string): Skill {
    const skill = registry[name];
    if (!skill) {
        throw new Error(`Skill '${name}' not found. Available skills: ${Object.keys(registry).join(', ')}`);
    }
    return skill;
}

export function listSkills(): Skill[] {
    return Object.values(registry);
}

export interface SkillContext {
    sessionId: string;
    history: string[];
    input: string;
}

export interface Skill {
    name: string;
    description: string;
    run: (context: SkillContext) => Promise<string>;
}

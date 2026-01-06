import { Skill, SkillContext } from '../skills/types.js';

export async function runSkill(skill: Skill, context: SkillContext): Promise<string> {
    // Can be expanded to include logging, middleware, etc.
    return skill.run(context);
}

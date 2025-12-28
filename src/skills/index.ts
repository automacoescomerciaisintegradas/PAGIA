/**
 * PAGIA - Skills Module
 * Exportações do sistema de Skills
 * 
 * @module skills
 */

export {
    SkillRegistry,
    skillRegistry,
    type Skill,
    type SkillFrontmatter,
    type InstalledSkill,
    type SkillValidationResult,
} from './skill-registry.js';

export {
    MCPToolsManager,
    mcpToolsManager,
    type MCPTool,
    type MCPToolCall,
    type MCPToolResult,
} from './mcp-integration.js';

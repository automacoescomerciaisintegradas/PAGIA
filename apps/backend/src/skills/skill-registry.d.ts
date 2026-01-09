/**
 * PAGIA - Skill Registry
 * Sistema de gerenciamento de Habilidades (Skills)
 *
 * Baseado no formato Anthropic Skills:
 * - SKILL.md com frontmatter YAML
 * - name: max 64 chars, lowercase, hyphens, sem tags XML, sem palavras reservadas
 * - description: max 1024 chars, não vazio, sem tags XML
 *
 * @see https://github.com/anthropics/skills
 * @module skills/skill-registry
 * @author Automações Comerciais Integradas
 */
/**
 * Interface para o frontmatter do SKILL.md
 */
export interface SkillFrontmatter {
    /** Nome da skill: max 64 chars, lowercase, hyphens only */
    name: string;
    /** Descrição: max 1024 chars, não vazio */
    description: string;
    /** Versão semântica */
    version?: string;
    /** Autor */
    author?: string;
    /** Tags para categorização */
    tags?: string[];
    /** Dependências de outras skills */
    dependencies?: string[];
    /** Configuração de modelo AI (opcional) */
    model?: {
        provider?: string;
        name?: string;
        endpoint?: string;
    };
    /** Ferramentas MCP disponíveis */
    tools?: string[];
    /** Recursos MCP disponíveis */
    resources?: string[];
}
/**
 * Interface para uma Skill completa
 */
export interface Skill {
    frontmatter: SkillFrontmatter;
    content: string;
    instructions: string;
    filePath: string;
    isValid: boolean;
    validationErrors: string[];
}
/**
 * Interface para Skill instalada
 */
export interface InstalledSkill {
    skill: Skill;
    installedAt: Date;
    updatedAt: Date;
    enabled: boolean;
    source: 'local' | 'registry' | 'github';
}
/**
 * Resultado de validação
 */
export interface SkillValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Classe SkillRegistry - Registro de Skills
 */
export declare class SkillRegistry {
    private static instance;
    private skillsPath;
    private installed;
    private registryUrl;
    private constructor();
    /**
     * Obtém instância singleton
     */
    static getInstance(): SkillRegistry;
    /**
     * Define o caminho das skills
     */
    setSkillsPath(path: string): void;
    /**
     * Obtém o caminho das skills
     */
    getSkillsPath(): string;
    /**
     * Carrega skills instaladas do disco
     */
    private loadInstalled;
    /**
     * Salva skills instaladas no disco
     */
    private saveInstalled;
    /**
     * Valida o nome da skill
     */
    validateName(name: string): SkillValidationResult;
    /**
     * Valida a descrição da skill
     */
    validateDescription(description: string): SkillValidationResult;
    /**
     * Valida uma skill completa
     */
    validate(skillPath: string): SkillValidationResult;
    /**
     * Parseia o frontmatter YAML do SKILL.md
     */
    parseFrontmatter(content: string): {
        frontmatter: SkillFrontmatter | null;
        body: string;
    };
    /**
     * Carrega uma skill de um arquivo
     */
    loadSkillFromFile(filePath: string): Skill | null;
    /**
     * Lista todas as skills no diretório
     */
    listSkills(): Skill[];
    /**
     * Lista skills instaladas
     */
    listInstalled(options?: {
        enabled?: boolean;
    }): InstalledSkill[];
    /**
     * Obtém uma skill instalada
     */
    getInstalled(name: string): InstalledSkill | undefined;
    /**
     * Verifica se uma skill está instalada
     */
    isInstalled(name: string): boolean;
    /**
     * Instala uma skill de um caminho local
     */
    installFromLocal(sourcePath: string): Promise<InstalledSkill>;
    /**
     * Instala uma skill do GitHub
     */
    installFromGitHub(repoUrl: string): Promise<InstalledSkill>;
    /**
     * Desinstala uma skill
     */
    uninstall(name: string): Promise<boolean>;
    /**
     * Habilita uma skill
     */
    enable(name: string): boolean;
    /**
     * Desabilita uma skill
     */
    disable(name: string): boolean;
    /**
     * Cria uma nova skill com scaffold
     */
    scaffold(name: string, options?: {
        description?: string;
        author?: string;
        tags?: string[];
        outputPath?: string;
    }): Promise<string>;
    /**
     * Obtém instruções de uma skill para uso com IA
     */
    getInstructions(name: string): string | null;
    /**
     * Busca skills por tag ou termo
     */
    search(query: string): Skill[];
}
export declare const skillRegistry: SkillRegistry;
//# sourceMappingURL=skill-registry.d.ts.map
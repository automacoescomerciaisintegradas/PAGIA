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

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'fs';
import { join, resolve, basename, dirname } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { eventBus } from '../core/event-bus.js';

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
 * Palavras reservadas que não podem ser usadas no nome da skill
 */
const RESERVED_WORDS = ['anthropic', 'claude', 'openai', 'gpt', 'google', 'gemini'];

/**
 * Regex para validar nome da skill
 */
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Regex para detectar tags XML
 */
const XML_TAG_PATTERN = /<\/?[a-zA-Z][^>]*>/;

/**
 * Classe SkillRegistry - Registro de Skills
 */
export class SkillRegistry {
    private static instance: SkillRegistry;
    private skillsPath: string = '';
    private installed: Map<string, InstalledSkill> = new Map();
    private registryUrl: string = 'https://skills.pagia.dev/api/v1';

    private constructor() { }

    /**
     * Obtém instância singleton
     */
    static getInstance(): SkillRegistry {
        if (!SkillRegistry.instance) {
            SkillRegistry.instance = new SkillRegistry();
        }
        return SkillRegistry.instance;
    }

    /**
     * Define o caminho das skills
     */
    setSkillsPath(path: string): void {
        this.skillsPath = resolve(path);
        if (!existsSync(this.skillsPath)) {
            mkdirSync(this.skillsPath, { recursive: true });
        }
        this.loadInstalled();
    }

    /**
     * Obtém o caminho das skills
     */
    getSkillsPath(): string {
        return this.skillsPath;
    }

    /**
     * Carrega skills instaladas do disco
     */
    private loadInstalled(): void {
        const installedPath = join(this.skillsPath, 'installed.json');

        if (!existsSync(installedPath)) {
            return;
        }

        try {
            const data = JSON.parse(readFileSync(installedPath, 'utf-8')) as InstalledSkill[];

            for (const item of data) {
                // Recarregar skill do arquivo
                if (existsSync(item.skill.filePath)) {
                    const skill = this.loadSkillFromFile(item.skill.filePath);
                    if (skill) {
                        this.installed.set(skill.frontmatter.name, {
                            skill,
                            installedAt: new Date(item.installedAt),
                            updatedAt: new Date(item.updatedAt),
                            enabled: item.enabled,
                            source: item.source,
                        });
                    }
                }
            }
        } catch {
            // Ignorar erros de parsing
        }
    }

    /**
     * Salva skills instaladas no disco
     */
    private saveInstalled(): void {
        const installedPath = join(this.skillsPath, 'installed.json');
        const data = Array.from(this.installed.values());
        writeFileSync(installedPath, JSON.stringify(data, null, 2), 'utf-8');
    }

    /**
     * Valida o nome da skill
     */
    validateName(name: string): SkillValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!name || name.trim() === '') {
            errors.push('Nome é obrigatório');
            return { valid: false, errors, warnings };
        }

        if (name.length > 64) {
            errors.push(`Nome deve ter no máximo 64 caracteres (atual: ${name.length})`);
        }

        if (!NAME_PATTERN.test(name)) {
            errors.push('Nome deve conter apenas letras minúsculas, números e hífens');
        }

        if (XML_TAG_PATTERN.test(name)) {
            errors.push('Nome não pode conter tags XML');
        }

        for (const reserved of RESERVED_WORDS) {
            if (name.toLowerCase().includes(reserved)) {
                errors.push(`Nome não pode conter palavra reservada: "${reserved}"`);
            }
        }

        return { valid: errors.length === 0, errors, warnings };
    }

    /**
     * Valida a descrição da skill
     */
    validateDescription(description: string): SkillValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!description || description.trim() === '') {
            errors.push('Descrição é obrigatória');
            return { valid: false, errors, warnings };
        }

        if (description.length > 1024) {
            errors.push(`Descrição deve ter no máximo 1024 caracteres (atual: ${description.length})`);
        }

        if (XML_TAG_PATTERN.test(description)) {
            errors.push('Descrição não pode conter tags XML');
        }

        return { valid: errors.length === 0, errors, warnings };
    }

    /**
     * Valida uma skill completa
     */
    validate(skillPath: string): SkillValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Verificar se arquivo existe
        const skillFile = join(skillPath, 'SKILL.md');
        if (!existsSync(skillFile)) {
            errors.push('Arquivo SKILL.md não encontrado');
            return { valid: false, errors, warnings };
        }

        try {
            const content = readFileSync(skillFile, 'utf-8');
            const { frontmatter } = this.parseFrontmatter(content);

            if (!frontmatter) {
                errors.push('Frontmatter YAML não encontrado ou inválido');
                return { valid: false, errors, warnings };
            }

            // Validar nome
            const nameValidation = this.validateName(frontmatter.name);
            errors.push(...nameValidation.errors);
            warnings.push(...nameValidation.warnings);

            // Validar descrição
            const descValidation = this.validateDescription(frontmatter.description);
            errors.push(...descValidation.errors);
            warnings.push(...descValidation.warnings);

            // Verificar versão (warning se ausente)
            if (!frontmatter.version) {
                warnings.push('Versão não especificada (recomendado: semver)');
            }

        } catch (error) {
            errors.push(`Erro ao parsear skill: ${error}`);
        }

        return { valid: errors.length === 0, errors, warnings };
    }

    /**
     * Parseia o frontmatter YAML do SKILL.md
     */
    parseFrontmatter(content: string): { frontmatter: SkillFrontmatter | null; body: string } {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);

        if (!match) {
            return { frontmatter: null, body: content };
        }

        try {
            const frontmatter = parseYaml(match[1]) as SkillFrontmatter;
            return { frontmatter, body: match[2] };
        } catch {
            return { frontmatter: null, body: content };
        }
    }

    /**
     * Carrega uma skill de um arquivo
     */
    loadSkillFromFile(filePath: string): Skill | null {
        const skillFile = filePath.endsWith('SKILL.md') ? filePath : join(filePath, 'SKILL.md');

        if (!existsSync(skillFile)) {
            return null;
        }

        try {
            const content = readFileSync(skillFile, 'utf-8');
            const { frontmatter, body } = this.parseFrontmatter(content);

            if (!frontmatter) {
                return null;
            }

            const validation = this.validate(dirname(skillFile));

            return {
                frontmatter,
                content,
                instructions: body,
                filePath: skillFile,
                isValid: validation.valid,
                validationErrors: validation.errors,
            };
        } catch {
            return null;
        }
    }

    /**
     * Lista todas as skills no diretório
     */
    listSkills(): Skill[] {
        if (!this.skillsPath || !existsSync(this.skillsPath)) {
            return [];
        }

        const skills: Skill[] = [];
        const entries = readdirSync(this.skillsPath, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const skillPath = join(this.skillsPath, entry.name);
                const skill = this.loadSkillFromFile(skillPath);
                if (skill) {
                    skills.push(skill);
                }
            }
        }

        return skills;
    }

    /**
     * Lista skills instaladas
     */
    listInstalled(options?: { enabled?: boolean }): InstalledSkill[] {
        let skills = Array.from(this.installed.values());

        if (options?.enabled !== undefined) {
            skills = skills.filter(s => s.enabled === options.enabled);
        }

        return skills;
    }

    /**
     * Obtém uma skill instalada
     */
    getInstalled(name: string): InstalledSkill | undefined {
        return this.installed.get(name);
    }

    /**
     * Verifica se uma skill está instalada
     */
    isInstalled(name: string): boolean {
        return this.installed.has(name);
    }

    /**
     * Instala uma skill de um caminho local
     */
    async installFromLocal(sourcePath: string): Promise<InstalledSkill> {
        const validation = this.validate(sourcePath);

        if (!validation.valid) {
            throw new Error(`Skill inválida: ${validation.errors.join(', ')}`);
        }

        const skill = this.loadSkillFromFile(sourcePath);
        if (!skill) {
            throw new Error('Não foi possível carregar a skill');
        }

        if (this.installed.has(skill.frontmatter.name)) {
            throw new Error(`Skill já instalada: ${skill.frontmatter.name}`);
        }

        // Copiar para o diretório de skills
        const targetPath = join(this.skillsPath, skill.frontmatter.name);
        if (!existsSync(targetPath)) {
            mkdirSync(targetPath, { recursive: true });
        }

        // Copiar todos os arquivos
        const { cpSync } = await import('fs');
        cpSync(sourcePath, targetPath, { recursive: true });

        // Recarregar do novo local
        const installedSkill = this.loadSkillFromFile(targetPath);
        if (!installedSkill) {
            throw new Error('Erro ao carregar skill instalada');
        }

        const installed: InstalledSkill = {
            skill: installedSkill,
            installedAt: new Date(),
            updatedAt: new Date(),
            enabled: true,
            source: 'local',
        };

        this.installed.set(skill.frontmatter.name, installed);
        this.saveInstalled();

        await eventBus.emit('skill:installed', { name: skill.frontmatter.name });

        return installed;
    }

    /**
     * Instala uma skill do GitHub
     */
    async installFromGitHub(repoUrl: string): Promise<InstalledSkill> {
        const { execSync } = await import('child_process');

        // Extrair nome do repo
        const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'skill';
        const tempPath = join(this.skillsPath, '.temp', repoName);

        // Limpar temp se existir
        if (existsSync(tempPath)) {
            rmSync(tempPath, { recursive: true, force: true });
        }

        mkdirSync(tempPath, { recursive: true });

        try {
            execSync(`git clone ${repoUrl} "${tempPath}"`, { stdio: 'ignore' });
            return await this.installFromLocal(tempPath);
        } finally {
            // Limpar temp
            if (existsSync(tempPath)) {
                rmSync(tempPath, { recursive: true, force: true });
            }
        }
    }

    /**
     * Desinstala uma skill
     */
    async uninstall(name: string): Promise<boolean> {
        const installed = this.installed.get(name);

        if (!installed) {
            return false;
        }

        // Remover diretório
        const skillPath = dirname(installed.skill.filePath);
        if (existsSync(skillPath)) {
            rmSync(skillPath, { recursive: true, force: true });
        }

        this.installed.delete(name);
        this.saveInstalled();

        await eventBus.emit('skill:uninstalled', { name });

        return true;
    }

    /**
     * Habilita uma skill
     */
    enable(name: string): boolean {
        const installed = this.installed.get(name);
        if (!installed) return false;

        installed.enabled = true;
        this.saveInstalled();
        return true;
    }

    /**
     * Desabilita uma skill
     */
    disable(name: string): boolean {
        const installed = this.installed.get(name);
        if (!installed) return false;

        installed.enabled = false;
        this.saveInstalled();
        return true;
    }

    /**
     * Cria uma nova skill com scaffold
     */
    async scaffold(name: string, options?: {
        description?: string;
        author?: string;
        tags?: string[];
        outputPath?: string;
    }): Promise<string> {
        // Validar nome
        const nameValidation = this.validateName(name);
        if (!nameValidation.valid) {
            throw new Error(`Nome inválido: ${nameValidation.errors.join(', ')}`);
        }

        const targetPath = options?.outputPath
            ? join(options.outputPath, name)
            : join(this.skillsPath, name);

        if (existsSync(targetPath)) {
            throw new Error(`Diretório já existe: ${targetPath}`);
        }

        mkdirSync(targetPath, { recursive: true });

        // Criar SKILL.md
        const frontmatter: SkillFrontmatter = {
            name,
            description: options?.description || `Skill ${name} para PAGIA`,
            version: '1.0.0',
            author: options?.author || '',
            tags: options?.tags || [],
        };

        const skillContent = `---
${stringifyYaml(frontmatter)}---

# ${name}

${frontmatter.description}

## Quando usar esta Skill

Use esta skill quando precisar...

## Instruções

Você é um especialista em ${name}. Siga estas diretrizes:

1. **Análise:** Primeiro, analise o contexto e os requisitos
2. **Planejamento:** Desenvolva um plano de ação
3. **Execução:** Execute as tarefas de forma sistemática
4. **Validação:** Verifique os resultados

## Exemplos

### Exemplo 1: Caso básico

\`\`\`
Entrada: ...
Saída esperada: ...
\`\`\`

## Notas

- Esta skill foi criada automaticamente pelo PAGIA
- Personalize as instruções conforme necessário
`;

        writeFileSync(join(targetPath, 'SKILL.md'), skillContent, 'utf-8');

        // Criar README.md
        const readmeContent = `# ${name}

${frontmatter.description}

## Instalação

\`\`\`bash
pagia skill install ${targetPath}
\`\`\`

## Uso

\`\`\`bash
pagia skill run ${name}
\`\`\`

## Licença

MIT
`;

        writeFileSync(join(targetPath, 'README.md'), readmeContent, 'utf-8');

        return targetPath;
    }

    /**
     * Obtém instruções de uma skill para uso com IA
     */
    getInstructions(name: string): string | null {
        const installed = this.installed.get(name);
        if (!installed || !installed.enabled) {
            return null;
        }

        return installed.skill.instructions;
    }

    /**
     * Busca skills por tag ou termo
     */
    search(query: string): Skill[] {
        const skills = this.listSkills();
        const lowerQuery = query.toLowerCase();

        return skills.filter(skill => {
            const matchName = skill.frontmatter.name.toLowerCase().includes(lowerQuery);
            const matchDesc = skill.frontmatter.description.toLowerCase().includes(lowerQuery);
            const matchTags = skill.frontmatter.tags?.some(
                tag => tag.toLowerCase().includes(lowerQuery)
            );

            return matchName || matchDesc || matchTags;
        });
    }
}

// Singleton exportado
export const skillRegistry = SkillRegistry.getInstance();

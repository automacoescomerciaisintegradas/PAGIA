/**
 * PAGIA - Conductor Agent
 * Agente inspirado no Conductor para Desenvolvimento Orientado por Contexto
 * 
 * @module agents/specialized/conductor-agent
 * @author Automações Comerciais Integradas
 */

import { BaseAgent, AgentInput, AgentOutput, SuggestedAction } from '../base-agent.js';
import type { AIProvider } from '../../types/index.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { writeFile, readFile, ensureDir, listFiles, fileExists } from '../../utils/file-utils.js';

export type TrackType = 'feature' | 'bugfix' | 'improvement' | 'refactor';
export type TrackStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';

export interface Track {
    id: string;
    title: string;
    description: string;
    type: TrackType;
    status: TrackStatus;
    createdAt: Date;
    updatedAt: Date;
    phases: Phase[];
}

export interface Phase {
    id: string;
    name: string;
    status: TaskStatus;
    tasks: Task[];
    checkpoint?: string; // commit SHA
}

export interface Task {
    id: string;
    name: string;
    description: string;
    status: TaskStatus;
    commitSha?: string;
    tests?: string[];
}

export interface ProjectContext {
    product: string;
    productGuidelines: string;
    techStack: string;
    workflow: string;
    codeStyleguides: string[];
}

/**
 * Classe ConductorAgent - Gerente de projeto proativo
 * Implementa Context-Driven Development
 */
export class ConductorAgent extends BaseAgent {
    readonly name = 'Agente Conductor';
    readonly role = 'Gerente de Projeto Proativo';
    readonly description = 'Gerencia o ciclo de vida completo de desenvolvimento: Contexto → Spec & Plan → Implement';
    readonly module = 'conductor';

    private conductorPath: string = '';
    private context: ProjectContext | null = null;

    capabilities = [
        'setup de projeto',
        'criação de tracks',
        'geração de specs',
        'planejamento de tarefas',
        'implementação guiada',
        'verificação de fases',
        'checkpoints git',
        'tdd workflow',
    ];

    instructions = `
Você é o Conductor, um gerente de projeto proativo que segue um protocolo rigoroso.

Filosofia: "Measure twice, code once" (Meça duas vezes, codifique uma)

Princípios Guia:
1. O Plano é a Fonte da Verdade - Todo trabalho deve ser rastreado no plan.md
2. O Tech Stack é Deliberado - Mudanças devem ser documentadas ANTES da implementação
3. Test-Driven Development - Escreva testes antes de implementar
4. Alta Cobertura de Código - Almeje >80% de cobertura
5. Experiência do Usuário Primeiro - Priorize UX em cada decisão

Ciclo de Vida de Cada Tarefa:
1. [ ] Selecionar próxima tarefa do plan.md
2. [~] Marcar como em progresso
3. 🔴 Escrever testes que falham (Red)
4. 🟢 Implementar para passar os testes (Green)
5. 🔵 Refatorar mantendo testes verdes (Refactor)
6. ✅ Verificar cobertura
7. 📝 Commitar com git notes
8. [x] Marcar como completo com SHA

Comandos disponíveis:
- /setup: Configurar contexto do projeto
- /newTrack: Iniciar nova feature ou bugfix
- /implement: Implementar próxima tarefa
- /status: Verificar status do projeto
- /revert: Reverter trabalho
  `;

    menu = [
        { trigger: '/setup', description: 'Configurar contexto do projeto' },
        { trigger: '/newTrack', description: 'Iniciar nova track (feature/bugfix)' },
        { trigger: '/implement', description: 'Implementar próxima tarefa' },
        { trigger: '/status', description: 'Verificar status do projeto' },
        { trigger: '/revert', description: 'Reverter trabalho de uma track' },
        { trigger: '/checkpoint', description: 'Criar checkpoint de verificação' },
    ];

    constructor(conductorPath: string = '.conductor', aiProvider?: Partial<AIProvider>) {
        super(aiProvider);
        this.conductorPath = conductorPath;
    }

    /**
     * Executa comando do Conductor
     */
    async execute(input: AgentInput): Promise<AgentOutput> {
        const startTime = Date.now();
        const prompt = input.prompt.trim();

        try {
            let content: string;
            let suggestedActions: SuggestedAction[] = [];

            if (prompt.startsWith('/setup')) {
                content = await this.executeSetup(input);
            } else if (prompt.startsWith('/newTrack')) {
                content = await this.executeNewTrack(prompt.replace('/newTrack', '').trim(), input);
            } else if (prompt.startsWith('/implement')) {
                content = await this.executeImplement(input);
            } else if (prompt.startsWith('/status')) {
                content = await this.executeStatus(input);
            } else if (prompt.startsWith('/revert')) {
                content = await this.executeRevert(input);
            } else if (prompt.startsWith('/checkpoint')) {
                content = await this.executeCheckpoint(input);
            } else {
                // Comando geral - consultar IA
                content = await this.executeGeneral(input);
            }

            return this.createOutput(content, undefined, startTime, suggestedActions);
        } catch (error) {
            throw new Error(`Erro no Conductor: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * /setup - Configurar projeto
     */
    private async executeSetup(input: AgentInput): Promise<string> {
        ensureDir(this.conductorPath);

        const response = await this.callAI(`
Você está configurando o Conductor para um novo projeto.
Por favor, analise o diretório do projeto e gere os artefatos de contexto.

Gere o conteúdo para os seguintes arquivos:

1. **product.md** - Defina:
   - Nome do produto
   - Descrição
   - Objetivos e metas
   - Usuários-alvo
   - Features principais

2. **product-guidelines.md** - Defina:
   - Tom de voz
   - Identidade visual
   - Padrões de UX
   - Mensagens da marca

3. **tech-stack.md** - Defina:
   - Linguagens de programação
   - Frameworks e bibliotecas
   - Banco de dados
   - Ferramentas de build
   - Ambiente de deploy

4. **workflow.md** - Defina:
   - Estratégia de commits
   - Padrões de branch
   - Processo de review
   - Práticas de TDD
   - Critérios de Done

Forneça cada arquivo em um bloco de código markdown com o nome do arquivo como título.
    `, input.context);

        // Parse e salvar arquivos
        const files = this.parseFiles(response.content);

        for (const [filename, content] of Object.entries(files)) {
            const filePath = join(this.conductorPath, filename);
            writeFile(filePath, content);
        }

        // Criar tracks.md vazio
        writeFile(join(this.conductorPath, 'tracks.md'), `# Tracks do Projeto

## Tracks Ativas

*Nenhuma track ativa no momento.*

## Tracks Concluídas

*Nenhuma track concluída ainda.*
`);

        // Criar diretórios
        ensureDir(join(this.conductorPath, 'tracks'));
        ensureDir(join(this.conductorPath, 'code_styleguides'));

        return `## ✅ Setup Concluído!

O Conductor foi configurado com sucesso. Os seguintes artefatos foram criados:

- 📄 \`${this.conductorPath}/product.md\`
- 📄 \`${this.conductorPath}/product-guidelines.md\`
- 📄 \`${this.conductorPath}/tech-stack.md\`
- 📄 \`${this.conductorPath}/workflow.md\`
- 📄 \`${this.conductorPath}/tracks.md\`
- 📁 \`${this.conductorPath}/tracks/\`
- 📁 \`${this.conductorPath}/code_styleguides/\`

### Próximos Passos

1. Revise os arquivos gerados e ajuste conforme necessário
2. Use \`/newTrack\` para iniciar uma nova feature ou bugfix
3. Use \`/implement\` para seguir o workflow TDD

${response.content}`;
    }

    /**
     * /newTrack - Criar nova track
     */
    private async executeNewTrack(description: string, input: AgentInput): Promise<string> {
        // Carregar contexto
        this.loadContext();

        // Gerar ID único
        const trackId = `track-${Date.now()}`;
        const trackDir = join(this.conductorPath, 'tracks', trackId);
        ensureDir(trackDir);

        // Gerar spec e plan com IA
        const response = await this.callAI(`
Você está criando uma nova Track para o Conductor.

Descrição da Track: ${description || 'Não especificada - pergunte ao usuário'}

Contexto do Projeto:
${this.context?.product || 'Não configurado'}
${this.context?.techStack || 'Não configurado'}

Gere dois artefatos:

## 1. spec.md

O arquivo de especificação deve conter:
- Título da feature/bugfix
- Descrição detalhada
- Critérios de aceitação
- Casos de uso
- Requisitos técnicos
- Dependências

## 2. plan.md

O arquivo de plano deve conter:
- Fases numeradas com tarefas
- Cada tarefa com checkbox: \`- [ ] Tarefa\`
- Estimativas de esforço
- Dependências entre tarefas

Use o formato:

\`\`\`markdown:spec.md
# [Título]
...
\`\`\`

\`\`\`markdown:plan.md
# Plano de Implementação

## Fase 1: [Nome]
- [ ] Tarefa 1.1
- [ ] Tarefa 1.2

## Fase 2: [Nome]
...
\`\`\`
    `, { ...input.context, description });

        // Parse e salvar
        const files = this.parseFiles(response.content);

        for (const [filename, content] of Object.entries(files)) {
            writeFile(join(trackDir, filename), content);
        }

        // Criar metadata.json
        const metadata: Track = {
            id: trackId,
            title: description || 'Nova Track',
            description: description || '',
            type: 'feature',
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            phases: [],
        };

        writeFile(join(trackDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

        // Atualizar tracks.md
        this.updateTracksIndex(trackId, metadata.title, 'pending');

        return `## 🎯 Nova Track Criada: ${trackId}

### Artefatos Gerados

- 📄 \`${trackDir}/spec.md\` - Especificação detalhada
- 📄 \`${trackDir}/plan.md\` - Plano de implementação
- 📄 \`${trackDir}/metadata.json\` - Metadados

### Próximos Passos

1. **Revise a spec.md** - Verifique se os requisitos estão corretos
2. **Revise o plan.md** - Ajuste as fases e tarefas conforme necessário
3. **Execute \`/implement\`** - Inicie a implementação seguindo TDD

${response.content}`;
    }

    /**
     * /implement - Implementar próxima tarefa
     */
    private async executeImplement(input: AgentInput): Promise<string> {
        // Encontrar track ativa
        const activeTrack = this.findActiveTrack();

        if (!activeTrack) {
            return `## ⚠️ Nenhuma Track Ativa

Não há nenhuma track em progresso. Use \`/newTrack\` para criar uma nova.

Tracks disponíveis:
${this.listPendingTracks()}`;
        }

        // Ler plan.md
        const planPath = join(this.conductorPath, 'tracks', activeTrack, 'plan.md');
        const plan = readFile(planPath);

        // Encontrar próxima tarefa pendente
        const nextTask = this.findNextPendingTask(plan);

        if (!nextTask) {
            return `## ✅ Track Completa!

Todas as tarefas da track \`${activeTrack}\` foram concluídas.

Use \`/checkpoint\` para criar um checkpoint de verificação.`;
        }

        // Gerar implementação com TDD
        const response = await this.callAI(`
Você está implementando a próxima tarefa seguindo o workflow TDD.

**Track:** ${activeTrack}
**Tarefa Atual:** ${nextTask}

**Plano Completo:**
\`\`\`markdown
${plan}
\`\`\`

**Contexto do Projeto:**
${this.context?.techStack || 'Não configurado'}
${this.context?.workflow || 'Não configurado'}

## Workflow TDD

### 1. 🔴 FASE RED - Escrever Testes Primeiro

Gere os testes que devem FALHAR inicialmente:
- Defina os cenários de teste
- Use as convenções do projeto
- Inclua edge cases

### 2. 🟢 FASE GREEN - Implementação Mínima

Após os testes, forneça:
- Código mínimo para passar os testes
- Siga as guidelines do projeto
- Documente decisões importantes

### 3. 🔵 FASE REFACTOR - Melhorias

Sugira refatorações:
- Sem mudar comportamento
- Melhorar legibilidade
- Remover duplicações

### 4. 📝 Atualização do Plano

Forneça a linha atualizada do plan.md:
- De: \`- [ ] ${nextTask}\`
- Para: \`- [x] ${nextTask} <!-- SHA: [commit_sha] -->\`
    `, input.context);

        // Atualizar task para in-progress
        const updatedPlan = plan.replace(
            `- [ ] ${nextTask}`,
            `- [~] ${nextTask}`
        );
        writeFile(planPath, updatedPlan);

        return `## 🚀 Implementando: ${nextTask}

### Status: Em Progresso [~]

${response.content}

---

### Próximos Passos

1. Execute os testes gerados (devem falhar)
2. Implemente o código
3. Execute os testes novamente (devem passar)
4. Use \`/implement\` para a próxima tarefa`;
    }

    /**
     * /status - Verificar status
     */
    private async executeStatus(input: AgentInput): Promise<string> {
        let status = `# 📊 Status do Projeto\n\n`;

        // Verificar se setup foi feito
        const tracksPath = join(this.conductorPath, 'tracks.md');

        if (!fileExists(tracksPath)) {
            return `## ⚠️ Projeto não configurado

Execute \`/setup\` primeiro para configurar o Conductor.`;
        }

        // Carregar tracks
        const tracksContent = readFile(tracksPath);
        status += `## Tracks\n\n${tracksContent}\n\n`;

        // Listar tracks ativas com seu progresso
        const tracksDir = join(this.conductorPath, 'tracks');
        if (existsSync(tracksDir)) {
            const tracks = listFiles(tracksDir, { extensions: ['json'] });

            for (const trackFile of tracks) {
                if (trackFile.endsWith('metadata.json')) {
                    const meta = JSON.parse(readFile(trackFile)) as Track;
                    const planPath = trackFile.replace('metadata.json', 'plan.md');

                    if (fileExists(planPath)) {
                        const plan = readFile(planPath);
                        const completed = (plan.match(/- \[x\]/g) || []).length;
                        const inProgress = (plan.match(/- \[~\]/g) || []).length;
                        const pending = (plan.match(/- \[ \]/g) || []).length;
                        const total = completed + inProgress + pending;

                        status += `### ${meta.title} (${meta.id})\n`;
                        status += `- Status: ${meta.status}\n`;
                        status += `- Progresso: ${completed}/${total} tarefas (${Math.round(completed / total * 100)}%)\n`;
                        status += `- Em progresso: ${inProgress}\n\n`;
                    }
                }
            }
        }

        return status;
    }

    /**
     * /revert - Reverter trabalho
     */
    private async executeRevert(input: AgentInput): Promise<string> {
        const response = await this.callAI(`
O usuário quer reverter trabalho de uma track.

Forneça um guia de como reverter:
1. Identificar commits da track (usando git notes)
2. Escolher nível de reversão (tarefa, fase, track completa)
3. Preparar comandos git para reversão
4. Atualizar plan.md

Pergunte ao usuário:
- Qual track deseja reverter?
- Reverter até qual ponto?
    `, input.context);

        return `## ⏪ Reverter Trabalho

${response.content}`;
    }

    /**
     * /checkpoint - Criar checkpoint
     */
    private async executeCheckpoint(input: AgentInput): Promise<string> {
        const response = await this.callAI(`
O usuário quer criar um checkpoint de verificação.

Gere um protocolo de verificação:

1. **Testes Automatizados**
   - Comando para executar: \`npm test\` ou equivalente
   - Cobertura mínima: 80%

2. **Verificação Manual**
   - Passos detalhados para verificar a implementação
   - Comportamentos esperados

3. **Checklist de Review**
   - [ ] Testes passando
   - [ ] Cobertura adequada
   - [ ] Código revisado
   - [ ] Documentação atualizada

4. **Comando de Checkpoint**
   \`\`\`bash
   git add .
   git commit -m "conductor(checkpoint): Phase X complete"
   git notes add -m "Verificação concluída em [data]"
   \`\`\`

Confirme com o usuário se tudo está correto.
    `, input.context);

        return `## 🏁 Checkpoint de Verificação

${response.content}

---

**Confirma a criação do checkpoint?** [sim/não]`;
    }

    /**
     * Comando geral
     */
    private async executeGeneral(input: AgentInput): Promise<string> {
        this.loadContext();

        const response = await this.callAI(`
Contexto do Projeto:
${this.context?.product || 'Não configurado'}
${this.context?.techStack || 'Não configurado'}

Solicitação do usuário:
${input.prompt}

Responda considerando o contexto do projeto e as melhores práticas de desenvolvimento.
    `, input.context);

        return response.content;
    }

    /**
     * Carrega contexto do projeto
     */
    private loadContext(): void {
        try {
            this.context = {
                product: this.loadFile('product.md'),
                productGuidelines: this.loadFile('product-guidelines.md'),
                techStack: this.loadFile('tech-stack.md'),
                workflow: this.loadFile('workflow.md'),
                codeStyleguides: [],
            };
        } catch {
            this.context = null;
        }
    }

    /**
     * Carrega arquivo do conductor
     */
    private loadFile(filename: string): string {
        const filePath = join(this.conductorPath, filename);
        if (fileExists(filePath)) {
            return readFile(filePath);
        }
        return '';
    }

    /**
     * Parseia arquivos do output da IA
     */
    private parseFiles(content: string): Record<string, string> {
        const files: Record<string, string> = {};
        const regex = /```(?:markdown)?:?(\S+\.md)\n([\s\S]*?)```/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
            const filename = match[1];
            const fileContent = match[2].trim();
            files[filename] = fileContent;
        }

        // Fallback para padrão alternativo
        if (Object.keys(files).length === 0) {
            const altRegex = /## \d+\. (\w+\.md)\n\n```\w*\n([\s\S]*?)```/g;
            while ((match = altRegex.exec(content)) !== null) {
                files[match[1]] = match[2].trim();
            }
        }

        return files;
    }

    /**
     * Encontra track ativa
     */
    private findActiveTrack(): string | null {
        const tracksDir = join(this.conductorPath, 'tracks');

        if (!existsSync(tracksDir)) {
            return null;
        }

        const dirs = listFiles(tracksDir, { extensions: ['json'] });

        for (const file of dirs) {
            if (file.endsWith('metadata.json')) {
                const meta = JSON.parse(readFile(file)) as Track;
                if (meta.status === 'in-progress') {
                    return meta.id;
                }
            }
        }

        // Se não há in-progress, retornar primeira pending
        for (const file of dirs) {
            if (file.endsWith('metadata.json')) {
                const meta = JSON.parse(readFile(file)) as Track;
                if (meta.status === 'pending') {
                    // Marcar como in-progress
                    meta.status = 'in-progress';
                    meta.updatedAt = new Date();
                    writeFile(file, JSON.stringify(meta, null, 2));
                    return meta.id;
                }
            }
        }

        return null;
    }

    /**
     * Encontra próxima tarefa pendente
     */
    private findNextPendingTask(plan: string): string | null {
        const match = plan.match(/- \[ \] (.+)/);
        return match ? match[1] : null;
    }

    /**
     * Lista tracks pendentes
     */
    private listPendingTracks(): string {
        const tracksDir = join(this.conductorPath, 'tracks');

        if (!existsSync(tracksDir)) {
            return '*Nenhuma track disponível*';
        }

        let list = '';
        const files = listFiles(tracksDir, { extensions: ['json'] });

        for (const file of files) {
            if (file.endsWith('metadata.json')) {
                const meta = JSON.parse(readFile(file)) as Track;
                list += `- ${meta.id}: ${meta.title} [${meta.status}]\n`;
            }
        }

        return list || '*Nenhuma track disponível*';
    }

    /**
     * Atualiza índice de tracks
     */
    private updateTracksIndex(trackId: string, title: string, status: string): void {
        const tracksPath = join(this.conductorPath, 'tracks.md');
        let content = readFile(tracksPath);

        // Adicionar à seção ativa
        const activeSection = '## Tracks Ativas';
        content = content.replace(
            activeSection,
            `${activeSection}\n\n- [${trackId}](tracks/${trackId}/spec.md): ${title} \`${status}\``
        );

        writeFile(tracksPath, content);
    }

    /**
     * Define caminho do conductor
     */
    setConductorPath(path: string): void {
        this.conductorPath = path;
    }
}

// Criar instância padrão
export const conductorAgent = new ConductorAgent();

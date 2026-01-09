/**
 * PAGIA - Template Engine
 * Motor de templates baseado em Handlebars
 *
 * @module utils/template-engine
 * @author Automações Comerciais Integradas
 */
import Handlebars from 'handlebars';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, extname, basename } from 'path';
import { writeFile, ensureDir } from './file-utils.js';
/**
 * Classe TemplateEngine - Motor de templates com Handlebars
 */
export class TemplateEngine {
    static instance;
    templates = new Map();
    templatesPath = '';
    constructor() {
        this.registerHelpers();
    }
    /**
     * Obtém a instância singleton do TemplateEngine
     */
    static getInstance() {
        if (!TemplateEngine.instance) {
            TemplateEngine.instance = new TemplateEngine();
        }
        return TemplateEngine.instance;
    }
    /**
     * Registra helpers personalizados do Handlebars
     */
    registerHelpers() {
        // Helper: Data formatada
        Handlebars.registerHelper('date', (format) => {
            const now = new Date();
            if (format === 'iso') {
                return now.toISOString();
            }
            return now.toLocaleDateString('pt-BR');
        });
        // Helper: Data/hora atual
        Handlebars.registerHelper('now', () => {
            return new Date().toISOString();
        });
        // Helper: Uppercase
        Handlebars.registerHelper('uppercase', (str) => {
            return str?.toUpperCase() || '';
        });
        // Helper: Lowercase
        Handlebars.registerHelper('lowercase', (str) => {
            return str?.toLowerCase() || '';
        });
        // Helper: Capitalize
        Handlebars.registerHelper('capitalize', (str) => {
            if (!str)
                return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        });
        // Helper: Camel case
        Handlebars.registerHelper('camelCase', (str) => {
            if (!str)
                return '';
            return str
                .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
                .replace(/^./, (c) => c.toLowerCase());
        });
        // Helper: Pascal case
        Handlebars.registerHelper('pascalCase', (str) => {
            if (!str)
                return '';
            return str
                .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
                .replace(/^./, (c) => c.toUpperCase());
        });
        // Helper: Kebab case
        Handlebars.registerHelper('kebabCase', (str) => {
            if (!str)
                return '';
            return str
                .replace(/([a-z])([A-Z])/g, '$1-$2')
                .replace(/[\s_]+/g, '-')
                .toLowerCase();
        });
        // Helper: Snake case
        Handlebars.registerHelper('snakeCase', (str) => {
            if (!str)
                return '';
            return str
                .replace(/([a-z])([A-Z])/g, '$1_$2')
                .replace(/[\s-]+/g, '_')
                .toLowerCase();
        });
        // Helper: Comparação de igualdade
        Handlebars.registerHelper('eq', (a, b) => a === b);
        // Helper: Comparação de diferença
        Handlebars.registerHelper('ne', (a, b) => a !== b);
        // Helper: Maior que
        Handlebars.registerHelper('gt', (a, b) => a > b);
        // Helper: Menor que
        Handlebars.registerHelper('lt', (a, b) => a < b);
        // Helper: Maior ou igual
        Handlebars.registerHelper('gte', (a, b) => a >= b);
        // Helper: Menor ou igual
        Handlebars.registerHelper('lte', (a, b) => a <= b);
        // Helper: AND lógico
        Handlebars.registerHelper('and', (...args) => {
            args.pop(); // Remove options object
            return args.every(Boolean);
        });
        // Helper: OR lógico
        Handlebars.registerHelper('or', (...args) => {
            args.pop(); // Remove options object
            return args.some(Boolean);
        });
        // Helper: NOT lógico
        Handlebars.registerHelper('not', (value) => !value);
        // Helper: If then else inline
        Handlebars.registerHelper('ifelse', (condition, ifTrue, ifFalse) => {
            return condition ? ifTrue : ifFalse;
        });
        // Helper: Join array
        Handlebars.registerHelper('join', (arr, separator = ', ') => {
            if (!Array.isArray(arr))
                return '';
            return arr.join(separator);
        });
        // Helper: Length
        Handlebars.registerHelper('length', (arr) => {
            if (Array.isArray(arr))
                return arr.length;
            if (typeof arr === 'string')
                return arr.length;
            return 0;
        });
        // Helper: JSON stringify
        Handlebars.registerHelper('json', (obj, pretty = false) => {
            return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
        });
        // Helper: Repeat
        Handlebars.registerHelper('repeat', (count, options) => {
            let result = '';
            for (let i = 0; i < count; i++) {
                result += options.fn({ index: i, first: i === 0, last: i === count - 1 });
            }
            return result;
        });
        // Helper: Pluralize
        Handlebars.registerHelper('pluralize', (count, singular, plural) => {
            return count === 1 ? singular : plural;
        });
        // Helper: Truncate
        Handlebars.registerHelper('truncate', (str, length, suffix = '...') => {
            if (!str || str.length <= length)
                return str;
            return str.substring(0, length) + suffix;
        });
        // Helper: Índice do loop
        Handlebars.registerHelper('index', (index, offset = 0) => {
            return index + offset;
        });
        // Helper: Condicional com contains
        Handlebars.registerHelper('contains', (haystack, needle) => {
            if (Array.isArray(haystack)) {
                return haystack.includes(needle);
            }
            if (typeof haystack === 'string' && typeof needle === 'string') {
                return haystack.includes(needle);
            }
            return false;
        });
    }
    /**
     * Define o caminho base para templates
     */
    setTemplatesPath(path) {
        this.templatesPath = path;
    }
    /**
     * Carrega todos os templates de um diretório
     */
    loadTemplates(templatesDir) {
        const dir = templatesDir || this.templatesPath;
        if (!existsSync(dir)) {
            console.warn(`Diretório de templates não existe: ${dir}`);
            return;
        }
        const files = readdirSync(dir).filter((f) => extname(f) === '.hbs' || extname(f) === '.handlebars');
        for (const file of files) {
            const filePath = join(dir, file);
            const name = basename(file).replace(/\.(hbs|handlebars)$/, '');
            this.loadTemplate(name, filePath);
        }
    }
    /**
     * Carrega um template específico
     */
    loadTemplate(name, filePath) {
        if (!existsSync(filePath)) {
            throw new Error(`Template não encontrado: ${filePath}`);
        }
        const source = readFileSync(filePath, 'utf-8');
        const template = Handlebars.compile(source);
        this.templates.set(name, {
            name,
            template,
            path: filePath,
        });
    }
    /**
     * Compila uma string de template
     */
    compile(source) {
        return Handlebars.compile(source);
    }
    /**
     * Registra um template a partir de uma string
     */
    register(name, source) {
        const template = Handlebars.compile(source);
        this.templates.set(name, {
            name,
            template,
            path: '',
        });
    }
    /**
     * Registra um partial
     */
    registerPartial(name, source) {
        Handlebars.registerPartial(name, source);
    }
    /**
     * Registra um helper customizado
     */
    registerHelper(name, helper) {
        Handlebars.registerHelper(name, helper);
    }
    /**
     * Renderiza um template registrado
     */
    render(templateName, context = {}) {
        const compiled = this.templates.get(templateName);
        if (!compiled) {
            throw new Error(`Template não encontrado: ${templateName}`);
        }
        return compiled.template(context);
    }
    /**
     * Renderiza uma string de template
     */
    renderString(source, context = {}) {
        const template = Handlebars.compile(source);
        return template(context);
    }
    /**
     * Renderiza um arquivo de template
     */
    renderFile(filePath, context = {}) {
        if (!existsSync(filePath)) {
            throw new Error(`Arquivo de template não encontrado: ${filePath}`);
        }
        const source = readFileSync(filePath, 'utf-8');
        return this.renderString(source, context);
    }
    /**
     * Renderiza e salva em arquivo
     */
    renderToFile(templateName, outputPath, context = {}) {
        const content = this.render(templateName, context);
        ensureDir(outputPath);
        writeFile(outputPath, content);
    }
    /**
     * Verifica se um template está registrado
     */
    has(templateName) {
        return this.templates.has(templateName);
    }
    /**
     * Lista templates registrados
     */
    list() {
        return Array.from(this.templates.keys());
    }
    /**
     * Remove um template
     */
    remove(templateName) {
        return this.templates.delete(templateName);
    }
    /**
     * Limpa todos os templates
     */
    clear() {
        this.templates.clear();
    }
    /**
     * Recarrega um template
     */
    reload(templateName) {
        const compiled = this.templates.get(templateName);
        if (compiled && compiled.path) {
            this.loadTemplate(templateName, compiled.path);
        }
    }
}
// Singleton exportado
export const templateEngine = TemplateEngine.getInstance();
//# sourceMappingURL=template-engine.js.map
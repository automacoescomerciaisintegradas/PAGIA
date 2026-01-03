import fs from 'fs';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_HEADERS = ['## Papel', '## Descrição', '## Capacidades', '## Instruções'];

export function validateAgentMarkdownContent(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const header of REQUIRED_HEADERS) {
    if (!content.includes(header)) {
      errors.push(`Cabeçalho obrigatório ausente: ${header}`);
    }
  }

  // Verificar se '## Capacidades' contém ao menos um item
  const capsMatch = content.match(/## Capacidades\s*\n([\s\S]+?)(?=\n## |$)/);
  if (capsMatch) {
    const caps = capsMatch[1].split('\n').map(s => s.replace(/^-\s*/, '').trim()).filter(Boolean);
    if (caps.length === 0) {
      warnings.push('`## Capacidades` existe mas não contém itens.');
    }
  }

  // Verificar tamanho mínimo de instruções
  const instrMatch = content.match(/## Instruções\s*\n([\s\S]+?)(?=\n## |$)/);
  if (instrMatch) {
    const instr = instrMatch[1].trim();
    if (instr.length < 20) {
      warnings.push('`## Instruções` aparenta ser muito curto; considere detalhar mais.');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateAgentMarkdownFile(path: string): ValidationResult {
  if (!fs.existsSync(path)) {
    return { valid: false, errors: [`Arquivo não encontrado: ${path}`], warnings: [] };
  }

  const content = fs.readFileSync(path, 'utf-8');
  return validateAgentMarkdownContent(content);
}

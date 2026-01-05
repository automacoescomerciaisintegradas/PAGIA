import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

function findYamlFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findYamlFiles(full));
    } else if (/\.ya?ml$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

describe('Example plan files', () => {
  it('are valid YAML and respect minimal schema', () => {
    const base = join(process.cwd(), '.pagia', 'plans');
    const files = findYamlFiles(base);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const raw = readFileSync(file, 'utf-8');
      const parsed = YAML.parse(raw);
      expect(parsed).toBeTruthy();
      if (!parsed.name) throw new Error(`File ${file} missing top-level 'name' field`);

      // tasks or prompts or stages or models must be arrays if present
      if (parsed.tasks) {
        expect(Array.isArray(parsed.tasks)).toBe(true);
        for (const t of parsed.tasks) {
          if (!t.id) throw new Error(`File ${file} has a task missing 'id'`);
          if (!(t.title || t.name)) throw new Error(`File ${file} has a task missing 'title/name' (task id=${t.id || '<unknown>'})`);
        }
      }

      if (parsed.stages) {
        expect(Array.isArray(parsed.stages)).toBe(true);
      }

      if (parsed.prompts) {
        expect(Array.isArray(parsed.prompts)).toBe(true);
      }

      if (parsed.models) {
        expect(Array.isArray(parsed.models)).toBe(true);
      }
    }
  });
});

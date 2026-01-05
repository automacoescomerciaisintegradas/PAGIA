import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import os from 'os';
import YAML from 'yaml';

import { listTemplates } from '../apps/backend/src/commands/plan';

describe('plan list-templates', () => {
  let tmp: string;
  let pagiaDir: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(os.tmpdir(), 'pagia-plan-'));
    pagiaDir = join(tmp, '.pagia');
    mkdirSync(join(pagiaDir, 'plans', 'stages'), { recursive: true });
    mkdirSync(join(pagiaDir, 'plans', 'global'), { recursive: true });

    writeFileSync(join(pagiaDir, 'plans', 'stages', 'tpl-one.yaml'), YAML.stringify({ id: 'tpl1' }));
    writeFileSync(join(pagiaDir, 'plans', 'global', 'tpl-global.yaml'), YAML.stringify({ id: 'tplg' }));
  });

  afterEach(() => {
    try { rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  });

  it('lists all templates when no type provided', () => {
    const templates = listTemplates(pagiaDir);
    expect(templates.length).toBeGreaterThanOrEqual(2);
    expect(templates.some(t => t.file === 'tpl-one.yaml')).toBe(true);
    expect(templates.some(t => t.file === 'tpl-global.yaml')).toBe(true);
  });

  it('filters by type when provided', () => {
    const templates = listTemplates(pagiaDir, 'stages');
    expect(templates.length).toBe(1);
    expect(templates[0].file).toBe('tpl-one.yaml');
  });
});

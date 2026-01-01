import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import os from 'os';
import YAML from 'yaml';

import { listTemplatesDetailed } from '../src/commands/plan';

describe('plan list-templates verbose', () => {
  let tmp: string;
  let pagiaDir: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(os.tmpdir(), 'pagia-plan-'));
    pagiaDir = join(tmp, '.pagia');
    mkdirSync(join(pagiaDir, 'plans', 'stages'), { recursive: true });

    writeFileSync(join(pagiaDir, 'plans', 'stages', 'tpl-one.yaml'), YAML.stringify({ name: 'Tpl One', description: 'desc' }));
  });

  afterEach(() => {
    try { rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  });

  it('returns detailed template info', () => {
    const templates = listTemplatesDetailed(pagiaDir, 'stages');
    expect(templates.length).toBe(1);
    expect(templates[0].content.name).toBe('Tpl One');
    expect(templates[0].content.description).toBe('desc');
  });
});
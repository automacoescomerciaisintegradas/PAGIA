import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import os from 'os';
import YAML from 'yaml';

import { generatePlanFile } from '../src/commands/plan';

describe('plan generate', () => {
  let tmp: string;
  let pagiaDir: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(os.tmpdir(), 'pagia-plan-'));
    pagiaDir = join(tmp, '.pagia');
    mkdirSync(join(pagiaDir, 'plans', 'stages'), { recursive: true });

    // create a template
    const template = { id: 'tpl1', name: 'Template One', tasks: [{ id: 't1', name: 'Do something' }] };
    writeFileSync(join(pagiaDir, 'plans', 'stages', 'tpl-one.yaml'), YAML.stringify(template));
  });

  afterEach(() => {
    try { rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  });

  it('generates a plan from template and sets name', async () => {
    const path = await generatePlanFile(pagiaDir, 'stage', 'Generated Plan', 'tpl-one');
    const raw = readFileSync(path, 'utf-8');
    const parsed = YAML.parse(raw);
    expect(parsed.name).toBe('Generated Plan');
    expect(parsed.tasks[0].id).toBe('t1');
  });

  it('scaffolds a minimal stage plan when no template provided', async () => {
    const path = await generatePlanFile(pagiaDir, 'stage', 'Scaffold Plan');
    const parsed = YAML.parse(readFileSync(path, 'utf-8')) as any;
    expect(parsed.name).toBe('Scaffold Plan');
    expect(parsed.tasks).toBeDefined();
  });
});
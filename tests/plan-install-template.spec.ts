import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import os from 'os';
import YAML from 'yaml';

import { installTemplate } from '../apps/backend/src/commands/plan';

describe('plan install-template', () => {
  let tmp: string;
  let pagiaDir: string;
  let targetDir: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(os.tmpdir(), 'pagia-install-'));
    pagiaDir = join(tmp, '.pagia');
    targetDir = join(tmp, 'out');
    mkdirSync(join(pagiaDir, 'plans', 'stages'), { recursive: true });
    mkdirSync(targetDir, { recursive: true });

    writeFileSync(join(pagiaDir, 'plans', 'stages', 'web-app-mvp.yaml'), YAML.stringify({ name: 'Web App MVP', tasks: [{ id: 't1', name: 'Init' }] }));
  });

  afterEach(() => {
    try { rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  });

  it('installs template into target dir and sets name', async () => {
    const out = await installTemplate(pagiaDir, 'web-app-mvp', targetDir, { type: 'stages' });
    const file = readFileSync(out, 'utf-8');
    const parsed = YAML.parse(file);
    expect(parsed.name).toBe('Web App MVP');
    expect(parsed.tasks[0].id).toBe('t1');
  });

  it('throws if template not found', async () => {
    await expect(installTemplate(pagiaDir, 'nonexistent', targetDir)).rejects.toThrow();
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import os from 'os';
import YAML from 'yaml';

import { installTemplate } from '../src/commands/plan';

describe('plan install-template --force', () => {
  let tmp: string;
  let pagiaDir: string;
  let targetDir: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(os.tmpdir(), 'pagia-install-force-'));
    pagiaDir = join(tmp, '.pagia');
    targetDir = join(tmp, 'out');
    mkdirSync(join(pagiaDir, 'plans', 'stages'), { recursive: true });
    mkdirSync(targetDir, { recursive: true });

    writeFileSync(join(pagiaDir, 'plans', 'stages', 'web-app-mvp.yaml'), YAML.stringify({ name: 'Web App MVP', tasks: [{ id: 't1', name: 'Init' }] }));
    writeFileSync(join(targetDir, 'web-app-mvp.yaml'), YAML.stringify({ name: 'Existing' }));
  });

  afterEach(() => {
    try { rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  });

  it('throws if target exists and no --force', async () => {
    await expect(installTemplate(pagiaDir, 'web-app-mvp', targetDir, { type: 'stages' })).rejects.toThrow();
  });

  it('overwrites if --force is true', async () => {
    const out = await installTemplate(pagiaDir, 'web-app-mvp', targetDir, { type: 'stages', force: true });
    const parsed = YAML.parse(readFileSync(out, 'utf-8'));
    expect(parsed.name).toBe('Web App MVP');
  });
});
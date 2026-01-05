import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import os from 'os';
import YAML from 'yaml';

import { installTemplate } from '../apps/backend/src/commands/plan';

describe('plan install-template --dry-run', () => {
  let tmp: string;
  let pagiaDir: string;
  let targetDir: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(os.tmpdir(), 'pagia-install-dry-'));
    pagiaDir = join(tmp, '.pagia');
    targetDir = join(tmp, 'out');
    mkdirSync(join(pagiaDir, 'plans', 'stages'), { recursive: true });
    mkdirSync(join(pagiaDir, 'plans', 'global'), { recursive: true });
    mkdirSync(targetDir, { recursive: true });

    writeFileSync(join(pagiaDir, 'plans', 'stages', 'web-app-mvp.yaml'), YAML.stringify({ name: 'Web App MVP', tasks: [{ id: 't1', name: 'Init' }] }));
    writeFileSync(join(pagiaDir, 'plans', 'global', 'python-automation.md'), '# Title (Template: Python Automation)');
  });

  afterEach(() => {
    try { rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  });

  it('does not write file and returns target path for yaml', async () => {
    const out = await installTemplate(pagiaDir, 'web-app-mvp', targetDir, { type: 'stages', dryRun: true });
    expect(out.endsWith('.yaml')).toBe(true);
    expect(existsSync(out)).toBe(false);
  });

  it('does not write file and returns target path for md', async () => {
    const out = await installTemplate(pagiaDir, 'python-automation', targetDir, { type: 'global', name: 'Python Automation', dryRun: true });
    expect(out.endsWith('.md')).toBe(true);
    expect(existsSync(out)).toBe(false);
  });
});

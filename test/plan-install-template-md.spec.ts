import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import os from 'os';

import { installTemplate } from '../src/commands/plan';

describe('plan install-template (markdown)', () => {
  let tmp: string;
  let pagiaDir: string;
  let targetDir: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(os.tmpdir(), 'pagia-install-md-'));
    pagiaDir = join(tmp, '.pagia');
    targetDir = join(tmp, 'out');
    mkdirSync(join(pagiaDir, 'plans', 'global'), { recursive: true });
    mkdirSync(targetDir, { recursive: true });

    const md = `# PAGIA LEVEL 1: GLOBAL PLAN (Template: Python Automation)\n\n## 1. Objetivo Principal\n[PREENCHER]`;
    writeFileSync(join(pagiaDir, 'plans', 'global', 'python-automation.md'), md);
  });

  afterEach(() => {
    try { rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  });

  it('installs markdown template and replaces template label', async () => {
    const out = await installTemplate(pagiaDir, 'python-automation', targetDir, { type: 'global', name: 'Python Automation' });
    const file = readFileSync(out, 'utf-8');
    expect(file.includes('(Template: Python Automation)')).toBe(true);
    expect(out.endsWith('.md')).toBe(true);
  });
});
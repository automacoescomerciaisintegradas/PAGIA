import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import os from 'os';
import YAML from 'yaml';

vi.mock('inquirer', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, prompt: vi.fn() } as any;
});
import * as inquirer from 'inquirer';
import { installTemplateInteractive } from '../src/commands/plan';

describe('plan install-template interactive', () => {
  let tmp: string;
  let pagiaDir: string;
  let targetDir: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(os.tmpdir(), 'pagia-install-int-'));
    pagiaDir = join(tmp, '.pagia');
    targetDir = join(tmp, 'out');
    mkdirSync(join(pagiaDir, 'plans', 'stages'), { recursive: true });
    mkdirSync(targetDir, { recursive: true });

    writeFileSync(join(pagiaDir, 'plans', 'stages', 'web-app-mvp.yaml'), YAML.stringify({ name: 'Web App MVP', tasks: [{ id: 't1', name: 'Init' }] }));
  });

  afterEach(() => {
    try { rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ignore */ }
    vi.restoreAllMocks();
  });

  it('cancels when user declines overwrite', async () => {
    // create existing target file
    writeFileSync(join(targetDir, 'web-app-mvp.yaml'), YAML.stringify({ name: 'Existing' }));

    (inquirer as any).prompt = vi.fn().mockResolvedValue({ ok: false });

    const res = await installTemplateInteractive(pagiaDir, 'web-app-mvp', targetDir, { type: 'stages' });

    expect(res.canceled).toBe(true);
    const content = readFileSync(join(targetDir, 'web-app-mvp.yaml'), 'utf-8');
    const parsed = YAML.parse(content);
    expect(parsed.name).toBe('Existing');
  });

  it('overwrites when user confirms', async () => {
    // create existing target file
    writeFileSync(join(targetDir, 'web-app-mvp.yaml'), YAML.stringify({ name: 'Existing' }));

    (inquirer as any).prompt = vi.fn().mockResolvedValue({ ok: true });

    const res = await installTemplateInteractive(pagiaDir, 'web-app-mvp', targetDir, { type: 'stages' });

    expect(res.canceled).toBe(false);
    const content = readFileSync(join(targetDir, 'web-app-mvp.yaml'), 'utf-8');
    const parsed = YAML.parse(content);
    expect(parsed.name).toBe('Web App MVP');
  });

  it('does not prompt in dry-run and returns path', async () => {
    writeFileSync(join(targetDir, 'web-app-mvp.yaml'), YAML.stringify({ name: 'Existing' }));

    // ensure prompt not called
    (inquirer as any).prompt = vi.fn();

    const res = await installTemplateInteractive(pagiaDir, 'web-app-mvp', targetDir, { type: 'stages', dryRun: true });
    expect(res.canceled).toBe(false);
    expect(res.path.endsWith('.yaml')).toBe(true);
    expect((inquirer as any).prompt).not.toHaveBeenCalled();
  });
});
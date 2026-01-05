import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import os from 'os';
import YAML from 'yaml';

import { applyUpdates } from '../apps/backend/src/commands/update';

describe('applyUpdates integration', () => {
  let tmp: string;
  let pagiaDir: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(os.tmpdir(), 'pagia-test-'));
    pagiaDir = join(tmp, '.pagia');
    mkdirSync(join(pagiaDir, 'plans', 'stages'), { recursive: true });

    const plan = {
      name: 'example-todos',
      tasks: [
        { id: 't1', title: 'Task one', status: 'blocked' },
        { id: 't2', title: 'Task two', status: 'in-progress' },
      ],
    };

    writeFileSync(join(pagiaDir, 'plans', 'stages', 'example-todos.yaml'), YAML.stringify(plan));
  });

  afterEach(() => {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  });

  it('applies status updates to a plan YAML file', async () => {
    const updates = [
      { taskId: 't1', field: 'status', newValue: 'pending', plan: 'example-todos' },
      { taskId: 't2', field: 'status', newValue: 'completed', plan: 'example-todos' },
    ];

    // applyUpdates mutates plan files on disk
    await applyUpdates(pagiaDir, updates as any);

    const file = readFileSync(join(pagiaDir, 'plans', 'stages', 'example-todos.yaml'), 'utf-8');
    const parsed = YAML.parse(file);

    const t1 = parsed.tasks.find((t: any) => t.id === 't1');
    const t2 = parsed.tasks.find((t: any) => t.id === 't2');

    expect(t1.status).toBe('pending');
    expect(t2.status).toBe('completed');
  });
});

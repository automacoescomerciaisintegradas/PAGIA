import { describe, it, expect } from 'vitest';
import { humanizeTemplateName } from '../src/commands/plan';

describe('humanizeTemplateName', () => {
  it('converts template file names to a friendly name', () => {
    expect(humanizeTemplateName('tpl-one')).toBe('Tpl One');
    expect(humanizeTemplateName('onboarding_template')).toBe('Onboarding Template');
    expect(humanizeTemplateName('')).toBe('New Plan');
  });
});
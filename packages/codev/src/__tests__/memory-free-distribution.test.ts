import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { copyHotTierDefaults, copyColdTierDefaults } from '../lib/scaffold.js';
import { readHotTierFiles, renderHotContextBlock, syncHotContextBlock } from '../lib/managed-block.js';
import { buildHotTierContext } from '../commands/porch/prompts.js';

const root = path.resolve(import.meta.dirname, '../../../..');
const names = ['arch', 'arch-critical', 'lessons-learned', 'lessons-critical'].map(n => n + '.md');
describe('memory-free distribution', () => {
  it('does not create persistent context on any scaffold path', () => {
    const project = fs.mkdtempSync(path.join(os.tmpdir(), 'codev-no-context-'));
    for (const fn of [copyHotTierDefaults, copyColdTierDefaults]) {
      expect(fn(project, path.join(root, 'codev-skeleton'))).toEqual({ copied: [], skipped: [] });
      expect(fn(project, path.join(root, 'codev-skeleton'), { skipExisting: true })).toEqual({ copied: [], skipped: [] });
    }
    expect(fs.readdirSync(project)).toEqual([]);
  });
  it('never reads project files or skeleton fallback for context injection', () => {
    const read = vi.spyOn(fs, 'readFileSync');
    expect(readHotTierFiles('/not-present')).toEqual([]);
    expect(buildHotTierContext('/not-present')).toBe('');
    expect(renderHotContextBlock('/not-present')).toBe('');
    expect(syncHotContextBlock('/not-present')).toEqual([]);
    expect(read).not.toHaveBeenCalled(); read.mockRestore();
  });
  it('ships no retired file or reference in framework content', () => {
    function walk(folder: string) {
      for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
        const file = path.join(folder, entry.name);
        if (entry.isDirectory()) { expect(entry.name).not.toBe('update-arch-docs'); walk(file); }
        else {
          expect(names).not.toContain(entry.name);
          const text = fs.readFileSync(file, 'utf8');
          for (const name of names) expect(text, file).not.toContain(name);
        }
      }
    }
    walk(path.join(root, 'codev-skeleton'));
  });
  it('keeps implementation checks but removes the retired producer checks', () => {
    for (const name of ['spir', 'aspir', 'pir']) {
      const protocol = JSON.parse(fs.readFileSync(path.join(root, 'codev-skeleton/protocols', name, 'protocol.json'), 'utf8'));
      const review = protocol.phases.find((p: { id: string }) => p.id === 'review');
      expect(review).toBeDefined();
      expect(review.checks).not.toHaveProperty('review_has_arch_updates');
      expect(review.checks).not.toHaveProperty('review_has_lessons_updates');
      expect(protocol.phases.find((p: { id: string }) => p.id === 'implement').checks).toBeDefined();
    }
  });
});

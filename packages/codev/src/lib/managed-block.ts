/** Compatibility API: this distribution has no persistent context injection. */
export const HOT_BLOCK_BEGIN = '<!-- BEGIN CODEV HOT CONTEXT (generated — do not edit) -->';
export const HOT_BLOCK_END = '<!-- END CODEV HOT CONTEXT -->';
export const ROOT_DOCS = ['CLAUDE.md', 'AGENTS.md'] as const;
export function readHotTierFiles(_workspaceRoot: string): string[] { return []; }
export function renderHotContextBlock(_workspaceRoot: string): string { return ''; }
export function upsertHotContextBlock(docContent: string, _block: string): string { return docContent; }
export function syncHotContextBlock(_targetDir: string, _workspaceRoot?: string): string[] { return []; }

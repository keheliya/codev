/**
 * Scaffold utilities shared across codev init / adopt / update.
 *
 * Directory creation, skeleton copying, and root-file templating. Gitignore
 * management lives in `./gitignore.ts` (extracted in issue #882).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

interface CreateUserDirsOptions {
  skipExisting?: boolean;
}

interface CreateUserDirsResult {
  created: string[];
  skipped: string[];
}

/**
 * Create user data directories (specs, plans, reviews) with .gitkeep files
 */
export function createUserDirs(
  targetDir: string,
  options: CreateUserDirsOptions = {}
): CreateUserDirsResult {
  const { skipExisting = false } = options;
  const userDirs = ['specs', 'plans', 'reviews'];
  const created: string[] = [];
  const skipped: string[] = [];

  for (const dir of userDirs) {
    const dirPath = path.join(targetDir, 'codev', dir);
    if (skipExisting && fs.existsSync(dirPath)) {
      skipped.push(dir);
      continue;
    }
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');
    created.push(dir);
  }

  return { created, skipped };
}

interface CopyConsultTypesOptions {
  skipExisting?: boolean;
}

interface CopyConsultTypesResult {
  copied: string[];
  skipped: string[];
  directoryCreated: boolean;
}

/**
 * Copy consult-types directory from skeleton.
 * Contains review type prompts that users can customize.
 */
export function copyConsultTypes(
  targetDir: string,
  skeletonDir: string,
  options: CopyConsultTypesOptions = {}
): CopyConsultTypesResult {
  const { skipExisting = false } = options;
  const consultTypesDir = path.join(targetDir, 'codev', 'consult-types');
  const srcDir = path.join(skeletonDir, 'consult-types');
  const copied: string[] = [];
  const skipped: string[] = [];
  let directoryCreated = false;

  // Ensure consult-types directory exists
  if (!fs.existsSync(consultTypesDir)) {
    fs.mkdirSync(consultTypesDir, { recursive: true });
    directoryCreated = true;
  }

  // If source directory doesn't exist, return early
  if (!fs.existsSync(srcDir)) {
    return { copied, skipped, directoryCreated };
  }

  // Copy all .md files from skeleton consult-types
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const destPath = path.join(consultTypesDir, file);
    const srcPath = path.join(srcDir, file);

    if (skipExisting && fs.existsSync(destPath)) {
      skipped.push(file);
      continue;
    }

    fs.copyFileSync(srcPath, destPath);
    copied.push(file);
  }

  return { copied, skipped, directoryCreated };
}

interface CopyResourceTemplatesOptions {
  skipExisting?: boolean;
}

interface CopyResourceTemplatesResult {
  copied: string[];
  skipped: string[];
}

/** Copy the remaining optional resource templates. */
export function copyResourceTemplates(targetDir: string, skeletonDir: string,
  options: CopyResourceTemplatesOptions = {}): CopyResourceTemplatesResult {
  const copied: string[] = [], skipped: string[] = [];
  for (const name of ['cheatsheet.md', 'lifecycle.md']) {
    const dest = path.join(targetDir, 'codev', 'resources', name);
    const source = path.join(skeletonDir, 'templates', name);
    if (options.skipExisting && fs.existsSync(dest)) skipped.push(name);
    else if (fs.existsSync(source)) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(source, dest); copied.push(name);
    }
  }
  return { copied, skipped };
}

export const HOT_TIER_FILES = [] as const;
export const COLD_TIER_FILES: ReadonlyArray<{ src: string; dest: string }> = [];
export function copyHotTierDefaults(_targetDir: string, _skeletonDir: string,
  _options: CopyResourceTemplatesOptions = {}): CopyResourceTemplatesResult {
  return { copied: [], skipped: [] };
}
export function copyColdTierDefaults(_targetDir: string, _skeletonDir: string,
  _options: CopyResourceTemplatesOptions = {}): CopyResourceTemplatesResult {
  return { copied: [], skipped: [] };
}

interface CopyRootFilesOptions {
  handleConflicts?: boolean;
}

interface CopyRootFilesResult {
  copied: string[];
  conflicts: string[];
}

/**
 * Copy root files (CLAUDE.md, AGENTS.md) with project name substitution
 */
export function copyRootFiles(
  targetDir: string,
  skeletonDir: string,
  projectName: string,
  options: CopyRootFilesOptions = {}
): CopyRootFilesResult {
  const { handleConflicts = false } = options;
  const copied: string[] = [];
  const conflicts: string[] = [];

  const rootFiles = ['CLAUDE.md', 'AGENTS.md'];
  for (const file of rootFiles) {
    const srcPath = path.join(skeletonDir, 'templates', file);
    const destPath = path.join(targetDir, file);

    if (!fs.existsSync(srcPath)) {
      continue;
    }

    const content = fs.readFileSync(srcPath, 'utf-8')
      .replace(/\{\{PROJECT_NAME\}\}/g, projectName);

    if (fs.existsSync(destPath)) {
      if (handleConflicts) {
        // Create .codev-new for merge
        fs.writeFileSync(destPath + '.codev-new', content);
        conflicts.push(file);
      }
      // Skip if exists and not handling conflicts
    } else {
      fs.writeFileSync(destPath, content);
      copied.push(file);
    }
  }

  return { copied, conflicts };
}

interface CreateProjectsDirOptions {
  skipExisting?: boolean;
}

interface CreateProjectsDirResult {
  created: boolean;
  skipped: boolean;
}

/**
 * Create codev/projects/ directory for porch state files
 */
export function createProjectsDir(
  targetDir: string,
  options: CreateProjectsDirOptions = {}
): CreateProjectsDirResult {
  const { skipExisting = false } = options;
  const projectsDir = path.join(targetDir, 'codev', 'projects');

  if (skipExisting && fs.existsSync(projectsDir)) {
    return { created: false, skipped: true };
  }

  fs.mkdirSync(projectsDir, { recursive: true });
  fs.writeFileSync(path.join(projectsDir, '.gitkeep'), '');
  return { created: true, skipped: false };
}

/**
 * Recursively copy a directory
 */
function copyDirRecursive(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

interface CopySkillsOptions {
  skipExisting?: boolean;
}

interface CopySkillsResult {
  /** Project-relative provider-qualified paths, including a trailing slash. */
  copied: string[];
  /** Project-relative provider-qualified paths, including a trailing slash. */
  skipped: string[];
  /** Project-relative provider skill roots that were created. */
  directoriesCreated: string[];
}

export const SKILL_PROVIDERS = ['claude', 'codex'] as const;

/**
 * Copy provider-native skill trees from the skeleton to the project root.
 *
 * Each skill directory is the preservation boundary: skipExisting leaves an
 * existing skill completely untouched while still backfilling missing skills
 * for either provider.
 */
export function copySkills(
  targetDir: string,
  skeletonDir: string,
  options: CopySkillsOptions = {}
): CopySkillsResult {
  const { skipExisting = false } = options;
  const copied: string[] = [];
  const skipped: string[] = [];
  const directoriesCreated: string[] = [];

  for (const provider of SKILL_PROVIDERS) {
    const relativeSkillsDir = `.${provider}/skills`;
    const skillsDir = path.join(targetDir, relativeSkillsDir);
    const srcDir = path.join(skeletonDir, relativeSkillsDir);

    if (!fs.existsSync(skillsDir)) {
      fs.mkdirSync(skillsDir, { recursive: true });
      directoriesCreated.push(`${relativeSkillsDir}/`);
    }

    // Older/corrupt skeletons may not provide every configured provider.
    if (!fs.existsSync(srcDir)) continue;

    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const destSkillDir = path.join(skillsDir, entry.name);
      const relativeSkillDir = `${relativeSkillsDir}/${entry.name}/`;

      if (skipExisting && fs.existsSync(destSkillDir)) {
        skipped.push(relativeSkillDir);
        continue;
      }

      copyDirRecursive(path.join(srcDir, entry.name), destSkillDir);
      copied.push(relativeSkillDir);
    }
  }

  return { copied, skipped, directoriesCreated };
}

interface CopyRolesOptions {
  skipExisting?: boolean;
}

interface CopyRolesResult {
  copied: string[];
  skipped: string[];
  directoryCreated: boolean;
}

/**
 * Copy roles directory from skeleton to codev/roles/.
 * Contains role prompts (architect, builder, consultant) for agent sessions.
 */
export function copyRoles(
  targetDir: string,
  skeletonDir: string,
  options: CopyRolesOptions = {}
): CopyRolesResult {
  const { skipExisting = false } = options;
  const rolesDir = path.join(targetDir, 'codev', 'roles');
  const srcDir = path.join(skeletonDir, 'roles');
  const copied: string[] = [];
  const skipped: string[] = [];
  let directoryCreated = false;

  // Ensure roles directory exists
  if (!fs.existsSync(rolesDir)) {
    fs.mkdirSync(rolesDir, { recursive: true });
    directoryCreated = true;
  }

  // If source directory doesn't exist, return early
  if (!fs.existsSync(srcDir)) {
    return { copied, skipped, directoryCreated };
  }

  // Copy all .md files from skeleton roles
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const destPath = path.join(rolesDir, file);
    const srcPath = path.join(srcDir, file);

    if (skipExisting && fs.existsSync(destPath)) {
      skipped.push(file);
      continue;
    }

    fs.copyFileSync(srcPath, destPath);
    copied.push(file);
  }

  return { copied, skipped, directoryCreated };
}

interface CopyProtocolsOptions {
  skipExisting?: boolean;
}

interface CopyProtocolsResult {
  copied: string[];
  skipped: string[];
  directoryCreated: boolean;
}

/**
 * Copy protocol definitions from skeleton to codev/protocols/
 * Required for porch orchestration
 */
export function copyProtocols(
  targetDir: string,
  skeletonDir: string,
  options: CopyProtocolsOptions = {}
): CopyProtocolsResult {
  const { skipExisting = false } = options;
  const protocolsDir = path.join(targetDir, 'codev', 'protocols');
  const srcDir = path.join(skeletonDir, 'protocols');
  const copied: string[] = [];
  const skipped: string[] = [];
  let directoryCreated = false;

  // Ensure protocols directory exists
  if (!fs.existsSync(protocolsDir)) {
    fs.mkdirSync(protocolsDir, { recursive: true });
    directoryCreated = true;
  }

  // If source directory doesn't exist, return early
  if (!fs.existsSync(srcDir)) {
    return { copied, skipped, directoryCreated };
  }

  // Copy each protocol directory
  const protocols = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of protocols) {
    if (!entry.isDirectory()) {
      // Copy top-level files (like protocol-schema.json)
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(protocolsDir, entry.name);

      if (skipExisting && fs.existsSync(destPath)) {
        skipped.push(entry.name);
        continue;
      }

      fs.copyFileSync(srcPath, destPath);
      copied.push(entry.name);
      continue;
    }

    const destProtocolDir = path.join(protocolsDir, entry.name);
    const srcProtocolDir = path.join(srcDir, entry.name);

    if (skipExisting && fs.existsSync(destProtocolDir)) {
      skipped.push(entry.name + '/');
      continue;
    }

    copyDirRecursive(srcProtocolDir, destProtocolDir);
    copied.push(entry.name + '/');
  }

  return { copied, skipped, directoryCreated };
}

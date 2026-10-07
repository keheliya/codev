# MAINTAIN Protocol

Audit → Clean → Sync, in a single pass, then a PR. Two phases, one consultation during the
maintain phase and one before the PR.

## The state machine

```json
{{> protocols/maintain/protocol.json}}
```

## Before starting

Find the last run in `codev/maintain/`, note its base commit, and scope the audit to
`git log --oneline <base>..HEAD`. Maintenance without a since-marker re-audits the whole
repository every time and quietly stops being run.

## The maintain phase

**Audit** — find unused exports, unused dependencies, and orphaned files. Treat every hit as a
*candidate*, not a verdict: a detector cannot tell "vestigial" from "used by a path you did not
search". Confirm each with a targeted grep before removing it.

**Clean** — remove what you confirmed. Deletions go to `codev/maintain/.trash/` (gitignored,
30-day retention) rather than straight out, so a wrong call is recoverable for a month rather
than needing an archaeology session.

## The maintenance run file

Each run is recorded in `codev/maintain/` using this structure:

{{> protocols/maintain/templates/maintenance-run.md}}

## Scope discipline

Maintenance is where scope creep is most tempting, because everything you touch looks
improvable. Removing dead code is in scope; refactoring live code because you are already in the
file is not. File an issue instead.

Never `git add -A` / `--all` / `.` — stage each file explicitly by path.

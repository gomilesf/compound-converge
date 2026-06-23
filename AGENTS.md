# Agent Instructions

This repository is the root of the `compound-converge` coding-agent plugin and the marketplace metadata used to distribute it.

`AGENTS.md` is the canonical repo instruction file. Root `CLAUDE.md` and `GEMINI.md` exist as compatibility shims for tools that look for those filenames.

## Quick Start

```bash
bun install
bun run validate
bun test
```

## Directory Layout

```text
skills-src/        Canonical skill sources
plugins/codex/    Codex plugin root with generated runtime skills
plugins/claude/   Claude Code plugin root with generated base skills
plugins/generic/  Generic platform plugin root with generated base skills
.claude-plugin/   Claude Code marketplace descriptor
.agents/plugins/  Codex custom marketplace descriptor
.cursor-plugin/   Cursor marketplace descriptor
.opencode/        OpenCode plugin entrypoint and install notes
.pi/              Pi extension entrypoint
src/              Validation library code
scripts/          Text-interface wrappers around library code
tests/            Metadata and skill convention tests
docs/             Productization notes and architecture docs
```

## Repo Surfaces

Changes can affect one or more surfaces:

- canonical skill content under `skills-src/`
- generated runtime skill content under `plugins/*/skills/`
- platform manifests and marketplace metadata
- validation scripts and tests
- public installation docs

Do not assume a change is only docs or only packaging without checking the affected surface.

## Plugin Maintenance

- Keep the repo root as the marketplace/source repository root. Do not move platform plugin roots out of `plugins/`.
- Keep `skills-src/` as the single source of skill content. Generate platform skill roots with `bun run sync`.
- Do not create a root `skills/` directory. It is a forbidden legacy plugin surface.
- Update `README.md` when the skill inventory, install flow, or platform support changes.
- Run `bun run validate` and `bun test` after changes to manifests, skills, packaging entrypoints, or validation code.
- Run `bun run plugin:validate` when Claude Code is available locally.
- Do not hand-add generated release notes. Release history should be maintained separately from feature edits.

## Skill Portability

Each skill directory must be self-contained. A `SKILL.md` file may reference files in its own `references/`, `assets/`, or `scripts/` directories, but must not reference sibling skill directories with `../`.

If two skills need the same reference, duplicate the small reference file into each skill directory. Marketplace installs use versioned cache paths, so sibling or absolute source-repo paths are not portable.

## Runtime vs Authoring Context

These root instruction files guide contributors to this source repository. Installed skills run in the user's target project and read that project's local instructions. Behavior required at runtime belongs inside the relevant `skills-src/<name>/SKILL.md` source file, then must be synced into the generated `plugins/*/skills/<name>/SKILL.md` copies.

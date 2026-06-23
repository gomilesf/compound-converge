# Compound Converge Productization

## Goal

Package Compound Converge as a public coding-agent plugin while keeping Codex-only orchestration skills out of non-Codex installs.

## Reference Model

The reference implementation in `compound-engineering-plugin` uses a root-native distribution shape:

```text
repo root
|-- skills/             runtime skills
|-- .claude-plugin/     Claude Code plugin and marketplace metadata
|-- .codex-plugin/      Codex native plugin manifest
|-- .agents/plugins/    Codex custom marketplace descriptor
|-- .cursor-plugin/     Cursor plugin metadata
|-- .opencode/          OpenCode package entrypoint
|-- .pi/                Pi extension entrypoint
|-- src/                development and validation code
|-- scripts/            text-interface wrappers
|-- tests/              regression checks
`-- docs/               specs, plans, and solution notes
```

That root-native shape works when every platform should receive the same skills. Compound Converge has a different constraint: `plan-loop`, `build-loop`, and `multi-session` depend on Codex thread tools, callback transport, heartbeat handoff, and fresh-reviewer gates. They must not be exposed as Claude, Cursor, OpenCode, Pi, or Gemini skills.

## Target Architecture

Compound Converge therefore keeps one repository but uses separate platform plugin roots:

```text
compound-converge
|-- skills-src/
|   |-- plan/
|   |-- plan-review/
|   |-- plan-review-feedback/
|   |-- work/
|   |-- code-review/
|   |-- code-review-feedback/
|   |-- plan-loop/
|   |-- build-loop/
|   `-- multi-session/
|-- plugins/
|   |-- codex/
|   |   |-- .codex-plugin/plugin.json
|   |   `-- skills/        all nine skills
|   |-- claude/
|   |   |-- .claude-plugin/plugin.json
|   |   `-- skills/        six base skills
|   `-- generic/
|       |-- .cursor-plugin/plugin.json
|       `-- skills/        six base skills
|-- .claude-plugin/         marketplace descriptor
|-- .agents/plugins/        Codex marketplace descriptor
|-- .cursor-plugin/         Cursor marketplace descriptor
|-- .opencode/
|-- .pi/
|-- src/
|-- scripts/
|-- tests/
`-- docs/
```

## Key Decisions

### Platform roots enforce product boundaries

Native plugin loaders discover skills from a plugin root. Compound Converge uses different plugin roots so each host receives only the skills it can run:

- Claude Code marketplace source points at `./plugins/claude`, which contains only base skills.
- Codex marketplace source points at `./plugins/codex`, whose `.codex-plugin/plugin.json` points at `./skills/` and exposes all nine skills.
- Cursor, OpenCode, Pi, and Gemini-facing surfaces use the base-only generated skills under `./plugins/generic/skills`.

### Generated skill roots are committed

`skills-src/` is the canonical source tree. `scripts/sync-platform-skills.ts` generates the platform roots:

```bash
bun run sync
```

The generated roots are committed because users install directly from GitHub and should not need to run a build step before plugin discovery.

### Text interface for verification

`scripts/validate.ts` is the text interface for productization checks. It verifies platform metadata, repository identity, marketplace sources, Codex's native skills path, and platform skill surfaces:

```text
skills-src/               9 skills
plugins/codex/skills      9 skills
plugins/claude/skills     6 skills
plugins/generic/skills    6 skills
```

### Self-contained skills

Marketplace installs use versioned cache directories. A skill cannot rely on sibling skill paths such as `../multi-session/SKILL.md`. When loop skills need the multi-session protocol, they carry a skill-local copy under `references/multi-session-protocol.md`.

## Verification

Use these checks after changing product surfaces:

```bash
bun run sync
bun run validate
bun test
bun run plugin:validate
```

For Codex, use a temporary profile to verify that the custom marketplace descriptor is accepted without changing the user's real Codex config:

```bash
tmpdir=$(mktemp -d -t compound-converge-codex-XXXXXX)
CODEX_HOME="$tmpdir" codex plugin marketplace add "$PWD" --json
CODEX_HOME="$tmpdir" codex plugin marketplace list --json
rm -rf "$tmpdir"
```

Current Codex CLI builds can register a local marketplace through this path while still requiring the Codex app or `/plugins` TUI for the actual plugin installation flow.

# Compound Converge

Compound Converge is a small set of coding-agent skills for making planning, implementation, and review loops actually converge.

The core idea is simple: the session that wrote the plan or code should not be the final reviewer. A fresh reviewer catches assumptions the author carried through the work. The loop exits only after a new clean reviewer has no blocking findings.

## Workflow

```text
plan -> plan-review -> revise until stable
work -> code-review -> repair until stable
final fresh review -> done
```

The base skills work across supported agent hosts. The loop skills are Codex-only because they coordinate real Codex threads, callback transport, heartbeat waiting, and final fresh-reviewer gates.

## Skills

| Skill | Purpose | Best fit |
| --- | --- | --- |
| `/plan` | Read an issue and codebase, then write a sliced plan with an invariant matrix when needed | Claude Code, Codex |
| `/plan-review` | Review a plan against the actual codebase for missing surfaces, incomplete slices, and wrong invariants | Claude Code, Codex |
| `/plan-review-feedback` | Handle plan-review blockers inside the planner session before revising plan-owned artifacts | Claude Code, Codex |
| `/work` | Execute a plan slice by slice with TDD and implementation notes | Claude Code, Codex |
| `/code-review` | Review implementation against the plan and contract, separating code bugs from contract gaps | Claude Code, Codex |
| `/code-review-feedback` | Handle code-review blockers inside the worker session before repairing implementation-owned issues | Claude Code, Codex |
| `/plan-loop` | Orchestrate the plan -> fresh plan-review loop across real Codex threads | Codex |
| `/build-loop` | Orchestrate worker -> fresh code-review -> repair -> final fresh-review across real Codex threads | Codex |
| `/multi-session` | Shared Codex multi-thread protocol for specialist handoff, callbacks, heartbeat waiting, and exit gates | Codex |

## Install

### Claude Code

```text
/plugin marketplace add gomilesfd/compound-converge
/plugin install compound-converge
```

The Claude plugin exposes only the six base skills: `/plan`, `/plan-review`, `/plan-review-feedback`, `/work`, `/code-review`, and `/code-review-feedback`.

### Codex App

Compound Converge is installed as a custom plugin marketplace:

1. In the Codex app, open **Plugins** from the sidebar.
2. Click **Add** or **Add plugin marketplace**.
3. Enter:

   | Field | Value |
   | --- | --- |
   | Source | `gomilesfd/compound-converge` |
   | Git ref | `main` |
   | Sparse paths | leave blank |

4. Click **Add marketplace**.
5. Select **Compound Converge**, install **compound-converge**, then restart Codex.

### Codex CLI

Register the marketplace, then install through the Codex `/plugins` TUI:

```bash
codex plugin marketplace add gomilesfd/compound-converge
codex
```

Inside Codex, run `/plugins`, choose **Compound Converge**, install **compound-converge**, then restart Codex.

For a non-default Codex profile, run each step against the same `CODEX_HOME`:

```bash
CODEX_HOME="$HOME/.codex/profiles/work" codex plugin marketplace add gomilesfd/compound-converge
CODEX_HOME="$HOME/.codex/profiles/work" codex
```

### Cursor

In Cursor Agent chat, install from the plugin marketplace:

```text
/add-plugin compound-converge
```

### OpenCode

Add the plugin to your global or project `opencode.json`:

```json
{
  "plugin": ["compound-converge@git+https://github.com/gomilesfd/compound-converge.git"]
}
```

Restart OpenCode after changing the config. The OpenCode plugin registers the base-only generated skills under `plugins/generic/skills`.

### Pi

```bash
pi install git:github.com/gomilesfd/compound-converge
```

### Gemini CLI

```bash
gemini extensions install https://github.com/gomilesfd/compound-converge
```

## Local Development

```bash
bun install
bun run sync
bun run validate
bun test
bun run plugin:validate
```

### Load This Checkout Directly

Claude Code:

```bash
claude --plugin-dir "$PWD/plugins/claude"
```

Codex CLI:

```bash
codex plugin marketplace add "$PWD"
codex
```

Then run `/plugins`, choose **Compound Converge**, and install **compound-converge**.

OpenCode:

```json
{
  "plugin": ["/path/to/compound-converge"]
}
```

Pi:

```bash
pi -e "$PWD"
```

Gemini CLI:

```bash
gemini extensions install "$PWD"
```

## Repository Layout

```text
skills-src/        Canonical skill sources
plugins/codex/    Codex plugin root with all nine skills
plugins/claude/   Claude Code plugin root with six base skills
plugins/generic/  Base-only skill root for generic hosts
.claude-plugin/   Claude Code marketplace metadata
.agents/plugins/  Codex custom marketplace descriptor
.cursor-plugin/   Cursor marketplace metadata
.opencode/        OpenCode package entrypoint
.pi/              Pi extension entrypoint
src/              Productization validation library
scripts/          Sync and validation text interfaces
tests/            Metadata and skill convention tests
docs/             Productization notes
```

## License

[MIT](LICENSE)

# Loop Smoke Test (Claude Code transport)

Manual end-to-end check that the `cvg-multi-session` Gate 0 transport binding
works on Claude Code: spawn, continue (resume from transcript), completion
notification, fresh-vs-same reviewer semantics. Run it before releases that
touch the loop skills. It consumes real agent tokens, so it is a manual gate,
not part of `bun test`.

## Setup

In a Claude Code session (the orchestrator), create a scratch workspace:

```bash
mkdir -p /tmp/cvg-loop-smoke
echo "spec: add.py must define add(a, b) returning the sum a + b" > /tmp/cvg-loop-smoke/SPEC.txt
```

## Phases and pass criteria

Each phase maps to a build-loop phase and one transport operation.

**Phase 1 — worker spawn (spawn operation).** Spawn a `general-purpose`
subagent told to create `/tmp/cvg-loop-smoke/add.py` with a *deliberately
wrong* body (`return a - b`) and to end with the worker callback template.

- Pass: tool result returns an agent id; callback matches the template.

**Phase 2 — fresh review (spawn, no history).** Spawn a *new* subagent with
the fresh-review boundary line, pointing at `add.py` and `SPEC.txt`,
blocker-only reporting, read-only, reviewer callback template.

- Pass: verdict `not ready` with one P0 finding naming the `a - b` bug.

**Phase 3 — feedback to same worker (continue operation).** `SendMessage` to
the *Phase 1 agent id* with the exact reviewer findings under
`Code Review Feedback Input`, instructing repair + verification.

- Pass: harness reports `resumed from transcript`; worker fixes `add.py` to
  `a + b`, reports verification, and a `<task-notification>` fires on
  completion.

**Phase 4 — focused re-review to same reviewer (continue operation).**
`SendMessage` to the *Phase 2 agent id* with `Review mode: focused-re-review`,
asking it to verify *its own* first-pass findings without restating them.

- Pass: the reviewer correctly recalls its own P0 finding from first-pass
  context (proof of transcript-based context retention) and confirms the fix
  with no new blockers.

**Phase 5 — final fresh exit (spawn, no history).** Spawn another *new*
reviewer subagent with the same Phase 2 prompt shape.

- Pass: verdict `ready to merge`, findings none.

## Overall pass

All five phase criteria met, and every specialist id used came from a tool
result (never from specialist prose). Expected cost: ~5 subagent runs of
~25k tokens each.

## Codex equivalent

The same scenario runs on Codex by substituting the Gate 0 Codex column:
`create_thread` / `send_message_to_thread` / `read_thread` plus heartbeat
waiting instead of task notifications.

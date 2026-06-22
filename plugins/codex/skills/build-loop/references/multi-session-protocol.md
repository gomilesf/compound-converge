# Multi-Session Protocol Reference

This file is a skill-local copy of the protocol needed by `build-loop`. It keeps the loop skill self-contained when installed from a marketplace cache.

## Non-Negotiable Protocol Gates

### Gate 1: Real Codex Thread

Specialists must run in monitorable Codex threads.

- Use `create_thread` to create a new specialist thread unless the user explicitly named an existing Codex thread.
- Use `send_message_to_thread` to continue an existing specialist thread.
- Use `read_thread` to verify every specialist thread id immediately after creation or selection.
- Do not use multi-agent subagents, task agents, context-fork agents, local shell jobs, or background processes as substitutes.
- If `read_thread` cannot read the id, stop the workflow and retry with Codex thread tools or report a tool-layer blocker.
- If Codex thread tools are not loaded, search for `create_thread`, `send_message_to_thread`, and `read_thread` first.

The authoritative specialist identity is the id returned by `create_thread` or the source thread on a callback message.

### Gate 2: Orchestrator Callback Transport

Every specialist prompt must include:

- destination orchestrator Codex thread id,
- exact callback template,
- instruction to send the callback with `send_message_to_thread`,
- fallback instruction if callback transport is unavailable.

Callback transport block:

```text
Destination orchestrator Codex thread id: <orchestrator-thread-id>

When complete or blocked, send the callback to that thread with send_message_to_thread.
If send_message_to_thread is unavailable, write "callback transport failed" and include the exact callback text in your final answer.
```

The orchestrator treats the phase as pending until the callback is visible in the orchestrator thread or has been manually relayed by the user.

### Gate 3: Heartbeat Handoff

Waiting is handled by heartbeat automation, not manual polling.

Handoff sequence:

1. Send specialist work with `create_thread` or `send_message_to_thread`.
2. Verify the specialist thread once with `read_thread`.
3. Create or update a heartbeat automation for the current orchestrator thread.
4. Tell the user the specialist thread id and heartbeat id.
5. End the active turn.

If heartbeat automation tools are unavailable, search for `automation_update` first. If no heartbeat tool is available, report that fallback is unavailable and end the turn after one verified handoff.

Do not emulate heartbeat behavior with `sleep`, repeated `read_thread`, shell loops, timers, or repeated status checks in the same assistant turn.

### Gate 4: Step Back Before Repair

Never forward raw reviewer output as a patch list.

Classify every blocking finding before routing:

- local code bug,
- pattern bug across adjacent surfaces,
- targeted plan or contract gap,
- systemic design gap,
- missing real surface,
- missing required gate or verification,
- unsafe side-effect path,
- tooling or ops blocker,
- quality-only issue.

If the finding exposes a broader invariant, contract, or architecture issue, route it as such.

### Gate 5: Fresh Reviewer Exit

Same-reviewer pass is never the final exit condition.

The exit sequence is:

1. Fresh reviewer performs a complete first review.
2. If blockers exist, classify them and route repair or replanning.
3. Same reviewer performs a focused re-review.
4. If same reviewer passes, start a new fresh reviewer for another complete first review.
5. Exit only when the new fresh reviewer reports no blocking findings.

## Specialist Prompt Checklist

Every specialist prompt must include:

- role and scope,
- destination orchestrator Codex thread id,
- worktree or repo path,
- base/head refs when relevant,
- dirty-state warning and unrelated files,
- source documents, plans, behavior contracts, specs, or issue text,
- required role skill,
- mandatory repo rules and task-triggered local skills or runbooks,
- safety boundaries and allowed external side effects,
- exact callback transport block,
- exact callback template.

## Heartbeat Prompt Checklist

Heartbeat prompts should say:

- which specialist thread to check,
- what callback shape to detect,
- how to classify blockers,
- if still active, report one short status and continue waiting,
- do not busy-wait,
- delete or update the heartbeat when the phase is complete or stale.

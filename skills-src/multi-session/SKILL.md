---
name: multi-session
description: Orchestrate monitored Codex thread workflows with specialist handoff, callback transport, heartbeat waiting, role-specific review feedback handling, and fresh-reviewer exit gates. Use when the user asks to coordinate multiple Codex sessions, run an orchestrator workflow, supervise planning or implementation, or manage worker/reviewer loops.
argument-hint: "[goal, plan path, worktree, or workflow description]"
---

# Codex Multi-Session Workflow

Use this skill when the current Codex thread should act as an **orchestrator** over other real Codex threads. This is a protocol, not just a checklist.

The workflow is repo-independent. Repo rules, local skills, runbooks, secrets policy, deployment rules, and domain-specific safety constraints are injected into specialist prompts as mandatory context.

## Non-Negotiable Protocol Gates

Apply these gates before any planner, worker, reviewer, QA runner, or quality reviewer is launched.

### Gate 1: Real Codex Thread

Specialists must run in monitorable Codex threads.

- Use `create_thread` to create a new specialist thread unless the user explicitly named an existing Codex thread.
- Use `send_message_to_thread` to continue an existing specialist thread.
- Use `read_thread` to verify every specialist thread id immediately after creation or selection.
- Do not use multi-agent subagents, task agents, context-fork agents, local shell jobs, or background processes as substitutes.
- Do not treat a subagent id, job id, process id, local session id, or model-generated id as a Codex thread id.
- If `read_thread` cannot read the id, stop the workflow and retry with Codex thread tools or report a tool-layer blocker.
- If Codex thread tools are not loaded, search for `create_thread`, `send_message_to_thread`, and `read_thread` first. If they still cannot be loaded, report a tool-layer blocker.

The authoritative specialist identity is the id returned by `create_thread` or the source thread on a callback message, not whatever the specialist writes in prose.

### Gate 2: Orchestrator Callback Transport

Every specialist prompt must include:

- destination orchestrator Codex thread id,
- exact callback template,
- instruction to send the callback with `send_message_to_thread`,
- fallback instruction if callback transport is unavailable.

The specialist must send its callback to the orchestrator thread. A final answer left only in the specialist thread is not sufficient.

If the specialist cannot see its own thread id, it may write `thread id not exposed` in the callback body. That is acceptable only when the callback is delivered to the orchestrator thread; the orchestrator verifies source identity with `read_thread`.

If `send_message_to_thread` is unavailable inside the specialist thread, the specialist must say `callback transport failed` in its final answer and include the exact callback text for manual relay.

The orchestrator treats the phase as pending until the callback is visible in the orchestrator thread or has been manually relayed by the user.

### Gate 3: Heartbeat Handoff

Waiting is handled by heartbeat automation, not by manual polling.

Handoff sequence:

1. Send the specialist work with `create_thread` or `send_message_to_thread`.
2. Verify the specialist thread once with `read_thread`.
3. Create or update a heartbeat automation for the current orchestrator thread.
4. Tell the user the specialist thread id and heartbeat id.
5. End the active turn.

If heartbeat automation tools are not loaded, search for `automation_update` first. If no heartbeat tool is available, tell the user the fallback is unavailable and end the turn after one verified handoff; do not replace the missing heartbeat with manual polling.

Do not emulate a heartbeat with `sleep`, repeated `read_thread`, shell loops, timers, or repeated status checks in the same assistant turn.

A heartbeat turn may do one status check. If the specialist is still active, report one short status and stop. Do not sleep and check again.

Continue immediately only when an explicit callback is already present or `read_thread` already shows the specialist completed.

### Gate 4: Role-Specific Review Feedback

Reviewer feedback returns to the same planner or worker thread that produced the reviewed artifact.

The orchestrator must not classify findings, choose the repair route, filter reviewer output, or turn the review into a patch list.

Plan-review blockers return to the planner with the `plan-review-feedback` skill. The prompt must contain the exact reviewer blocker findings under a `Plan Review Feedback Input` section.

Code-review blockers return to the worker with the `code-review-feedback` skill. The prompt must contain the exact reviewer blocker findings under a `Code Review Feedback Input` section.

Role boundaries still apply: workers may repair implementation-owned findings only. Workers must stop and callback for plan gaps, contract gaps, systemic design gaps, reviewer clarification, or escalation. Only planners may produce plan or contract revisions.

The orchestrator continues only after the actor callback reports a role-valid result: implementation repair from a worker, plan or contract revision from a planner, or a blocker that needs planner, reviewer, user, or escalation handling.

### Gate 5: Fresh Reviewer Exit

Same-reviewer pass is never the final exit condition.

The exit sequence is:

1. Fresh reviewer performs a complete first review.
2. If blockers exist, return feedback to the same planner or worker and require the role-specific feedback skill.
3. Same reviewer performs a focused re-review after the actor produces a reviewable update.
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
- mandatory repo rules and task-triggered local skills/runbooks,
- safety boundaries and allowed external side effects,
- exact callback transport block,
- exact callback template.

Callback transport block:

```text
Destination orchestrator Codex thread id: <orchestrator-thread-id>

When complete or blocked, send the callback to that thread with send_message_to_thread.
If send_message_to_thread is unavailable, write "callback transport failed" and include the exact callback text in your final answer.
```

## Heartbeat Prompt Checklist

Heartbeat prompts should say:

- which specialist thread to check,
- what callback shape to detect,
- whether the actor completed the role-specific feedback intake,
- if still active, report one short status and continue waiting,
- do not busy-wait,
- delete or update the heartbeat when the phase is complete or stale.

## Completion Summary

When the workflow completes, summarize:

- base and final refs or final plan path,
- specialist thread ids verified with `read_thread`,
- callback transport status,
- review loop results,
- role-specific feedback results,
- verification gates,
- remaining known gaps,
- heartbeat cleanup,
- whether the fresh-reviewer exit condition was met.

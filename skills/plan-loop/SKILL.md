---
name: plan-loop
description: Orchestrate a monitored Codex planning loop with a planner, fresh plan reviewers, focused re-review, callback transport, heartbeat waiting, and strict fresh-reviewer exit gates. Use when the user asks to create or revise a plan through Codex sessions.
argument-hint: "[planning goal, requirements path, behavior contract path, or planning prompt]"
---

# Codex Plan Loop

Use this skill for plan-only multi-session orchestration.

Before doing anything, open and read `../multi-session/SKILL.md`, then apply the protocol gates from `multi-session`:

- real Codex thread gate,
- orchestrator callback transport gate,
- heartbeat handoff gate,
- step-back classification gate,
- fresh-reviewer exit gate.

Do not implement product code in this workflow.

## Phase 0: Orchestrator Setup

Record:

- current orchestrator thread id,
- worktree or repo path,
- current `git rev-parse HEAD` if available,
- dirty worktree state,
- source prompt and input documents,
- expected plan path or target docs directory when known.

Classify dirty files:

- plan-owned files,
- unrelated user artifacts,
- files the planner must not touch.

## Phase 1: Planner Handoff

Create the planner as a real Codex thread with `create_thread`.

Immediately verify the returned planner thread id with `read_thread`. If it is not readable, do not continue.

Planner prompt must include:

- role: planner,
- destination orchestrator Codex thread id,
- required planning skill, such as `plan` or another user-specified plan skill,
- source prompt and exact user goal,
- repo path and starting state,
- dirty-state warning,
- mandatory context documents,
- task-triggered local instructions or domain skills,
- plan-only boundary,
- output path rules,
- no implementation, no staging, no commit unless explicitly requested,
- callback transport block,
- callback template.

Planner callback template:

```text
我是 planner，我的 session/thread id 是 <id or thread id not exposed>。Orchestrator thread id: <orchestrator-id>. 我这一轮任务已经完成。Plan path: <absolute path>. Key status: <brief>. 请 orchestrator 决定下一步。
```

After verifying the planner thread, create or update a heartbeat and end the active turn. Do not use `sleep` or repeated `read_thread` to wait.

## Phase 2: Fresh Plan Review

After planner callback is visible in the orchestrator thread, create a new fresh reviewer Codex thread.

Immediately verify the reviewer thread id with `read_thread`.

Reviewer prompt must include:

- role: fresh plan reviewer,
- destination orchestrator Codex thread id,
- required plan-review skill, such as `plan-review`,
- original planning goal and source prompt,
- plan path,
- repo path and relevant context,
- mandatory context documents and local policies,
- read-only boundary,
- blocker-only reporting rule,
- callback transport block,
- callback template.

Reviewer callback template:

```text
我是 fresh reviewer，我的 session/thread id 是 <id or thread id not exposed>。Orchestrator thread id: <orchestrator-id>. 我这一轮首次完整 review 已完成。Verdict: <passed / blocking findings>. Findings: <none or numbered concise list>. 请 orchestrator 决定下一步。
```

Create or update a heartbeat and end the active turn while waiting. Do not manually poll.

Blocking plan findings include:

- missing required surface,
- incomplete behavior contract coverage,
- wrong ownership boundary,
- unclear external or API contract,
- missing migration, rollback, deletion, privacy, or safety lifecycle,
- insufficient test or verification gate,
- plan criterion that cannot be implemented as written,
- unsafe side-effect assumption.

## Phase 3: Step Back and Classify

If the reviewer reports blockers, classify before sending anything back:

- **Targeted gap**: plan architecture is sound, but a concrete surface, lifecycle, matrix row, or gate is missing.
- **Systemic gap**: the finding exposes a deeper design, ownership, contract, or behavior-model problem.
- **Out-of-scope issue**: valid concern, but outside this plan and allowed by source requirements.

Do not send raw findings as "please fix this".

## Phase 4: Planner Revision

Send classified findings to the same verified planner thread with `send_message_to_thread`.

The revision prompt must include:

- destination orchestrator Codex thread id,
- reviewer thread id,
- exact blocker text,
- orchestrator classification,
- targeted edit vs broader redesign instruction,
- unchanged scope boundaries,
- callback transport block,
- callback template.

Create or update a heartbeat and end the active turn.

## Phase 5: Focused Re-Review

After planner revision callback is visible in the orchestrator thread, send a focused re-review request to the same verified reviewer thread with `send_message_to_thread`.

Focused scope:

- verify old blockers were addressed,
- check directly related contradictions introduced by the revision,
- do not redo broad review unless the plan's core design changed.

Create or update a heartbeat and end the active turn.

If same reviewer still finds blockers, repeat Phase 3.

If same reviewer passes, do not exit. Continue to Phase 6.

## Phase 6: Final Fresh Review

Create a new fresh reviewer Codex thread for a complete first review of the revised plan. Verify it with `read_thread`.

Final exit condition:

- new fresh reviewer,
- complete first review,
- no blocking findings.

Only then can the orchestrator declare the plan loop complete.

## Completion Summary

Report:

- plan path,
- planner thread id,
- reviewer thread ids,
- callback transport status,
- blockers and step-back classifications,
- final fresh reviewer verdict,
- heartbeat cleanup,
- known gaps.

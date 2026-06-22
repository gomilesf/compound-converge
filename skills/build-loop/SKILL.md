---
name: build-loop
description: Orchestrate a monitored Codex implementation loop with a worker, code reviewers, repair routing, step-back classification, QA gates, callback transport, heartbeat waiting, and strict fresh-reviewer exit conditions.
argument-hint: "[plan path, base commit, or implementation goal]"
---

# Codex Build Loop

Use this skill for implementation work that should be executed by a monitored Codex worker and reviewed by monitored Codex reviewers.

Before doing anything, open and read `../multi-session/SKILL.md`, then apply the protocol gates from `multi-session`:

- real Codex thread gate,
- orchestrator callback transport gate,
- heartbeat handoff gate,
- step-back classification gate,
- fresh-reviewer exit gate.

## Phase 0: Orchestrator Setup

Record:

- current orchestrator thread id,
- implementation base commit with `git rev-parse HEAD`,
- worktree status,
- task-owned and unrelated dirty files,
- plan, behavior contract, specs, requirements, and triggered local policies,
- allowed external side effects, if any.

Pass unrelated dirty state to the worker and tell it not to overwrite those files.

## Phase 1: Worker Handoff

Create the worker as a real Codex thread with `create_thread`.

Immediately verify the returned worker thread id with `read_thread`. If it is not readable, do not continue.

Worker prompt must include:

- role: implementation worker,
- destination orchestrator Codex thread id,
- required work skill, such as `work` or another user-specified implementation skill,
- base commit,
- worktree path,
- dirty-state warning,
- plan path or implementation goal,
- mandatory repo context and local policies,
- implementation notes path when required,
- safety boundaries,
- per-slice execution requirement,
- callback transport block,
- callback templates.

Worker execution rules:

- read repo rules, product/spec/design authority, plan, behavior contract, related code, and related tests,
- use test-first or characterization-first posture required by the plan,
- avoid horizontal "write all tests first, then all implementation",
- work one slice at a time,
- run checks for each slice plus system-wide checks,
- make atomic commits when requested,
- maintain implementation notes only for decisions, deviations, gaps, risks, and tradeoffs not already covered by the plan,
- callback instead of silently changing scope when plan and code reality conflict.

Worker completion callback template:

```text
我是 worker，我的 session/thread id 是 <id or thread id not exposed>。Orchestrator thread id: <orchestrator-id>. 我这一轮实现任务已经完成。Base commit: <base>. Head commit: <head>. Key changes: <brief>. Verification: <commands/results>. Known gaps: <none or list>. 请 orchestrator 安排 fresh code reviewer。
```

Worker blocker callback template:

```text
我是 worker，我的 session/thread id 是 <id or thread id not exposed>。Orchestrator thread id: <orchestrator-id>. 我遇到 blocking contract gap。Gap: <id/summary>. Evidence: <files/tests>. 我建议 <repair/escalation>. 请 orchestrator 决定下一步。
```

After verifying the worker thread, create or update a heartbeat and end the active turn. Do not use `sleep` or repeated `read_thread` to wait.

## Phase 2: Fresh Code Review

After worker callback is visible in the orchestrator thread, create a fresh reviewer Codex thread. Verify it with `read_thread`.

Reviewer prompt must include:

- role: fresh code reviewer,
- destination orchestrator Codex thread id,
- required code-review skill, such as `code-review`,
- base commit and head commit,
- plan and implementation notes,
- `git diff <base>..HEAD`,
- changed files in full,
- related context files and tests,
- read-only boundary,
- blocker-only reporting rule,
- safety and external-side-effect criteria,
- callback transport block,
- callback template.

Reviewer callback template:

```text
我是 fresh code reviewer，我的 session/thread id 是 <id or thread id not exposed>。Orchestrator thread id: <orchestrator-id>. 我这一轮首次完整 code review 已完成。Verdict: <ready / not ready>. Findings: <none or numbered blocker list>. 请 orchestrator 决定下一步。
```

Create or update a heartbeat and end the active turn while waiting. Do not manually poll.

Reviewer should report blocking findings only:

- P0/P1 code bug,
- unmet plan criterion,
- missing real surface,
- contract gap,
- unsafe side-effect path,
- missing required migration, rollback, deletion, privacy, or verification gate,
- test/build/deploy gate missing where the plan requires it.

Non-blocking quality notes belong in a separate quality review unless the orchestrator requested them here.

## Phase 3: Mandatory Step Back Before Repair

This is the most important build-loop step.

For every blocking finding, ask:

1. Is this a local code bug, or does it expose a broader missing invariant?
2. Does the plan already define the expected behavior, or is this a contract gap?
3. Is the failing surface one instance of a repeated pattern elsewhere?
4. Could a narrow fix create inconsistent state, unsafe side effects, or replay/idempotency holes?
5. Does the test suite need a new gate for the class of issue, not only the exact example?
6. Does the implementation note or plan need to record a deviation or newly discovered contract?

Classify each finding:

- **Local code bug**: plan is clear; implementation is wrong in a bounded place.
- **Pattern bug**: the same flawed assumption likely appears in adjacent surfaces; worker must audit and repair the class.
- **Contract gap**: behavior is not defined well enough; planner or orchestrator must resolve before worker patches.
- **Systemic design gap**: current architecture or state model is insufficient; replan or design addendum required.
- **Verification gap**: implementation may be correct, but required proof is absent.
- **Ops/tooling blocker**: code may be correct, but external validation cannot complete safely.
- **Quality-only issue**: useful cleanup, not a blocker unless it threatens correctness or future safety.

Do not forward raw reviewer output to the worker.

## Phase 4: Worker Repair

Send classified repair work to the same verified worker thread with `send_message_to_thread`, unless the classification requires a plan loop or different specialist.

Repair prompt must include:

- destination orchestrator Codex thread id,
- original reviewer finding,
- orchestrator classification,
- targeted fix vs broader audit instruction,
- required regression tests and gates,
- unchanged safety boundaries,
- callback transport block,
- callback template.

Worker repair callback template:

```text
我是 worker，我的 session/thread id 是 <id or thread id not exposed>。Orchestrator thread id: <orchestrator-id>. 我这一轮 reviewer findings 修复已经完成。Base commit: <base>. Previous review head: <old>. New head commit: <new>. Fixed findings: <brief>. Verification: <commands/results>. Known gaps: <none or list>. 请 orchestrator 安排 same reviewer focused re-review。
```

Create or update a heartbeat and end the active turn.

If the classification was pattern bug or systemic bug, the worker must report what broader surface was audited.

## Phase 5: Same Reviewer Focused Re-Review

After repair callback is visible in the orchestrator thread, send focused re-review to the same verified reviewer thread with `send_message_to_thread`.

Focused scope:

- verify old blockers are fixed,
- inspect new repair diff,
- check whether new code introduced P0/P1 issues,
- if a contract or plan update changed a matrix, re-check only related matrix rows.

Create or update a heartbeat and end the active turn.

Same reviewer pass is not enough to exit.

## Phase 6: New Fresh Review

After same reviewer passes, create a new fresh code reviewer thread for a complete first review. Verify it with `read_thread`.

Final implementation exit condition:

- new fresh reviewer,
- complete first code review,
- no blocking findings of any class, including code bugs, contract gaps, unsafe side-effect paths, missing real surfaces, missing lifecycle coverage, or missing required gates.

If the new fresh reviewer finds blockers, repeat from Phase 3.

## Phase 7: QA and External Verification

If the plan requires integration, staging, deployment, end-to-end, or smoke checks, run them through a QA or ops worker after code review is clean, unless the plan explicitly orders them earlier.

QA worker prompt must include:

- destination orchestrator Codex thread id,
- exact versions under test,
- environment and safety boundaries,
- allowed external side effects,
- evidence/report path,
- stop-and-callback rule for failures,
- no-secrets rule,
- callback transport block,
- callback template.

Classify QA failures before routing:

- frontend bug,
- backend bug,
- contract gap,
- data/setup issue,
- ops/config issue,
- tooling limitation,
- runbook gap.

Real QA failures can reopen the build loop.

## Phase 8: Quality Review

Optionally run a separate quality reviewer for:

- modularity,
- code smells,
- hacky shortcuts,
- over-coupling,
- maintainability risks,
- test shape and fixture hygiene.

Quality findings are not automatically release blockers. The orchestrator decides whether to run cleanup based on risk and timing.

## Completion Summary

Report:

- base commit and final head,
- worker and reviewer thread ids verified with `read_thread`,
- callback transport status,
- review findings and step-back classifications,
- repair commits,
- final fresh reviewer result,
- QA evidence and gates,
- known gaps,
- whether external side effects were performed and restored.

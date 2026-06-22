---
name: review-feedback
description: "Handle reviewer feedback before repair. Step back, classify findings, choose the route, and define required verification gates."
---

# Review Feedback

Use this skill when a planner or worker session receives review feedback.

Do not immediately edit the plan or code. First convert the reviewer feedback
into a routing decision grounded in the original goal, plan, contract, diff, and
current workspace state.

The route is role-bound:

- A worker may repair implementation and verification gaps only when the accepted
  plan and contract already define the expected behavior.
- A worker must stop and callback for targeted plan gaps, contract gaps, and
  systemic design gaps. Workers never edit plans, contracts, surface matrices, or
  behavior scope.
- A planner may revise plans, contracts, surfaces, matrices, and verification
  gates, but must not hide implementation bugs by changing scope after the fact.

## Input

The task context provides:

- original goal or issue scope,
- current plan or implementation artifact,
- reviewer findings,
- reviewer thread or review identity when available,
- base and head refs for code feedback when available,
- prior implementation notes or planning notes when available.

## Process

### 1. Reload authority

Read the authoritative inputs before judging the feedback:

- original user goal, issue, or acceptance criteria,
- plan and behavior contract, if present,
- implementation notes, if present,
- changed files or plan document under review,
- exact reviewer findings.

Treat reviewer findings as evidence, not as a patch list.

### 2. Step back before repair

For every reviewer finding, ask:

1. Is this finding valid under the accepted goal, plan, and contract?
2. Is it a bounded local issue, or does it expose a repeated pattern?
3. Does the accepted plan already define the expected behavior?
4. Does the plan or contract need to change before implementation continues?
5. Could a narrow fix create inconsistent behavior across adjacent surfaces?
6. Is a new regression test, matrix cell, or verification gate needed?
7. Is the finding outside the agreed scope or non-blocking for this loop?

### 3. Classify findings

Classify each finding as one of:

- **Local code bug**: the plan is clear; implementation is wrong in a bounded place.
- **Pattern bug**: the same flawed assumption may appear in adjacent surfaces.
- **Targeted plan gap**: the plan is structurally sound but misses a surface,
  lifecycle, matrix row, or verification gate.
- **Contract gap**: expected behavior is not defined well enough to patch safely.
- **Systemic design gap**: architecture, ownership, state model, or protocol
  assumptions are insufficient.
- **Verification gap**: behavior may be correct, but required proof is absent.
- **Ops or tooling blocker**: external validation cannot complete safely.
- **Quality-only issue**: useful cleanup, not a blocker unless it threatens
  correctness or future safety.
- **Invalid or out of scope**: the finding is wrong, stale, already addressed, or
  outside the accepted scope.

### 4. Choose the route

Choose one route for each finding:

- **Repair locally**: fix the bounded implementation issue and add the required
  regression test or verification gate.
- **Audit and repair pattern**: inspect adjacent surfaces, repair the class of
  issue, and report what was audited.
- **Revise plan**: planner updates the plan, contract, surfaces, matrix, or gates
  before implementation continues. Workers must stop and callback when this route
  is selected.
- **Escalate contract decision**: stop and ask the coordination channel for the
  missing behavior decision.
- **Request reviewer clarification**: use only when the finding cannot be mapped
  to evidence after reading the relevant context.
- **Reject as non-blocking or out of scope**: explain why and preserve the agreed
  scope boundary.

### 5. Apply role boundaries

If you are the worker:

- continue only for **Repair locally**, **Audit and repair pattern**, or
  implementation-owned **Verification gap** routes,
- stop and callback for **Targeted plan gap**, **Contract gap**, **Systemic design
  gap**, reviewer clarification, escalation, or any route requiring plan or
  contract changes,
- do not edit plan documents, behavior contracts, acceptance criteria, surface
  matrices, or task scope.

If you are the planner:

- revise only plan-owned artifacts,
- do not edit implementation code,
- do not convert a real implementation bug into a scope reduction.

### 6. Act only after routing

After the routing decision is written down:

- planners revise the plan or contract only for findings routed to planning,
- workers repair code only for findings routed to implementation and already
  defined by the accepted plan or contract,
- workers update implementation notes when feedback reveals a plan deviation,
  contract gap, or audited pattern,
- both planners and workers preserve exact reviewer finding ids or wording in
  their response so the same reviewer can re-check precisely.

## Output

Before making edits, produce a compact routing summary:

```text
Review feedback intake:
1. Finding: <reviewer finding id or short quote>
   Classification: <classification>
   Route: <route>
   Required gate: <test, matrix update, verification, or none>
   Rationale: <one sentence grounded in plan/code evidence>
```

After acting, report:

- findings addressed,
- plan or code changes made,
- required gates run and results,
- findings rejected or escalated with rationale,
- remaining blockers, if any.

## Rules

- Do not treat reviewer prose as implementation instructions.
- Do not patch before classification and routing.
- Do not narrow a pattern bug to the single line named by the reviewer.
- Do not let workers invent missing behavior for contract gaps.
- Do not let workers change plans, contracts, surface matrices, or scope.
- Do not let workers continue implementation after identifying a plan, contract,
  or systemic design gap; they must callback for planner or coordination action.
- Do not let planners hide implementation bugs by editing scope after the fact.
- Do not drop invalid or out-of-scope findings silently; explain the rejection.

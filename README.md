# compound-converge

compound engineering gives you a way to plan, build and review with agents. but plan and work on their own never *stop* — review finds something, you fix it, review finds something else, and the loop drifts instead of landing.

this is the missing piece: a set of skills that make that loop **converge**.

plan → plan-review until the plan is stable. then work → code-review until the implementation is stable. every review runs in a **fresh session** — never the one that wrote the thing — and the loop only exits when a clean reviewer has nothing left to say.

## why fresh-reviewer

a session that just wrote the code can't review it. it carries the same assumptions it had while writing, so it confirms its own work instead of catching its blind spots. so review always happens in a new session that never saw the implementation. that's what turns "keep iterating" into "iterate until it actually converges."

## the two loops

**plan loop** — `plan` drafts the plan, a fresh `plan-review` tears it apart, repeat until it holds. then a human signs off.

**build loop** — `work` implements the signed-off plan slice by slice, a fresh `code-review` checks it against the plan and contract, repeat until it converges.

`multi-session` is the protocol underneath both: handoff, callback transport, heartbeat waiting, blocker classification, and the strict fresh-reviewer exit gate.

## the skills

| skill | what it does | works with |
|-------|--------------|------------|
| `plan` | reads the issue + codebase, writes a sliced plan with an invariant matrix | claude code, codex |
| `plan-review` | reviews a plan against the actual codebase — slices sufficient? surfaces complete? invariants right? | claude code, codex |
| `work` | executes the plan slice by slice with TDD, self-checks before declaring done | claude code, codex |
| `code-review` | reviews implementation against plan + contract, separates code bugs from contract gaps | claude code, codex |
| `plan-loop` | orchestrates the plan→plan-review loop across sessions | codex |
| `build-loop` | orchestrates the work→code-review loop across sessions | codex |
| `multi-session` | the cross-session protocol both loops run on | codex |

the four base skills (`plan`, `work`, `plan-review`, `code-review`) are tool-agnostic — claude code runs them fine on its own. the three `*-loop` skills automate the cross-session orchestration that codex needs (claude code has its own inner loop, so you can drive the same fresh-reviewer discipline by hand).

## install

drop the skills you want into your skills directory:

```
# claude code: the four base skills
cp -r skills/plan skills/work skills/plan-review skills/code-review ~/.claude/skills/

# codex: add the loops on top
cp -r skills/* ~/.codex/skills/
```

then point your agent at an issue and let the loop run.

## license

MIT

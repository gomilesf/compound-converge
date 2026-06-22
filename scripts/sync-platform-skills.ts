import { promises as fs } from "node:fs"
import path from "node:path"

const ROOT = process.cwd()

const BASE_SKILLS = ["plan", "plan-review", "work", "code-review", "review-feedback"].sort()
const CODEX_ONLY_SKILLS = ["plan-loop", "build-loop", "multi-session"].sort()
const CODEX_SKILLS = [...BASE_SKILLS, ...CODEX_ONLY_SKILLS].sort()

const PLATFORMS = [
  {
    name: "codex",
    skills: CODEX_SKILLS,
    target: "plugins/codex/skills",
  },
  {
    name: "claude",
    skills: BASE_SKILLS,
    target: "plugins/claude/skills",
  },
  {
    name: "generic",
    skills: BASE_SKILLS,
    target: "plugins/generic/skills",
  },
] as const

async function assertSourceSkill(skill: string): Promise<void> {
  const skillPath = path.join(ROOT, "skills-src", skill, "SKILL.md")
  const stat = await fs.stat(skillPath).catch(() => undefined)
  if (!stat?.isFile()) {
    throw new Error(`Missing source skill: skills-src/${skill}/SKILL.md`)
  }
}

async function copySkill(skill: string, targetRoot: string): Promise<void> {
  await assertSourceSkill(skill)
  await fs.cp(path.join(ROOT, "skills-src", skill), path.join(ROOT, targetRoot, skill), {
    recursive: true,
  })
}

for (const platform of PLATFORMS) {
  const targetRoot = path.join(ROOT, platform.target)
  await fs.rm(targetRoot, { recursive: true, force: true })
  await fs.mkdir(targetRoot, { recursive: true })

  for (const skill of platform.skills) {
    await copySkill(skill, platform.target)
  }

  console.log(`${platform.name}: synced ${platform.skills.length} skills to ${platform.target}`)
}

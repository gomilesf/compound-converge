import { promises as fs } from "node:fs"
import path from "node:path"
import {
  AUXILIARY_AGENT_NAMES,
  BASE_SKILLS,
  CLAUDE_SKILLS,
  CODEX_SKILLS,
  PLATFORM_AGENT_ROOTS,
  PLATFORM_SKILL_ROOTS,
} from "../src/metadata"
import {
  PROTOCOL_CONSUMER_SKILLS,
  assertNoPlatformMarkers,
  renderProtocolReference,
  stripPlatform,
  type Platform,
} from "../src/platform-content"

const ROOT = process.cwd()

const PLATFORMS: ReadonlyArray<{
  name: string
  platform?: Platform
  skills: readonly string[]
  target: string
}> = [
  { name: "codex", platform: "codex", skills: CODEX_SKILLS, target: PLATFORM_SKILL_ROOTS.codex },
  { name: "claude", platform: "claude", skills: CLAUDE_SKILLS, target: PLATFORM_SKILL_ROOTS.claude },
  { name: "generic", skills: BASE_SKILLS, target: PLATFORM_SKILL_ROOTS.generic },
]

const AGENT_TARGETS = [
  {
    name: "claude",
    extension: ".agent.md",
    source: PLATFORM_AGENT_ROOTS.sourceClaude,
    target: PLATFORM_AGENT_ROOTS.claude,
  },
  {
    name: "codex",
    extension: ".toml",
    source: PLATFORM_AGENT_ROOTS.sourceCodex,
    target: PLATFORM_AGENT_ROOTS.codex,
  },
] as const

async function assertSourceSkill(skill: string): Promise<void> {
  const skillPath = path.join(ROOT, PLATFORM_SKILL_ROOTS.source, skill, "SKILL.md")
  const stat = await fs.stat(skillPath).catch(() => undefined)
  if (!stat?.isFile()) {
    throw new Error(`Missing source skill: ${PLATFORM_SKILL_ROOTS.source}/${skill}/SKILL.md`)
  }
}

async function copySkill(skill: string, targetRoot: string): Promise<void> {
  await assertSourceSkill(skill)
  await fs.cp(path.join(ROOT, PLATFORM_SKILL_ROOTS.source, skill), path.join(ROOT, targetRoot, skill), {
    recursive: true,
  })
}

async function listMarkdownFiles(rootPath: string): Promise<string[]> {
  const entries = await fs.readdir(rootPath, { withFileTypes: true, recursive: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(entry.parentPath, entry.name))
}

// Per-platform builds keep only their own `<!-- codex -->`/`<!-- claude -->`
// blocks; the generic build ships platform-neutral base skills, so any marker
// reaching it is a source error.
async function applyPlatformContent(targetRoot: string, platform: Platform | undefined): Promise<void> {
  for (const filePath of await listMarkdownFiles(targetRoot)) {
    const content = await fs.readFile(filePath, "utf8")
    if (platform) {
      await fs.writeFile(filePath, stripPlatform(content, platform))
    } else {
      assertNoPlatformMarkers(content, path.relative(ROOT, filePath))
    }
  }
}

async function writeProtocolReferences(targetRoot: string, platform: Platform): Promise<void> {
  const canonical = await fs.readFile(
    path.join(ROOT, PLATFORM_SKILL_ROOTS.source, "cvg-multi-session", "SKILL.md"),
    "utf8",
  )

  for (const consumer of PROTOCOL_CONSUMER_SKILLS) {
    const referencesDir = path.join(ROOT, targetRoot, consumer, "references")
    await fs.mkdir(referencesDir, { recursive: true })
    await fs.writeFile(
      path.join(referencesDir, "cvg-multi-session-protocol.md"),
      stripPlatform(renderProtocolReference(canonical, consumer), platform),
    )
  }
}

async function copyAgent(agentName: string, extension: string, sourceRoot: string, targetRoot: string): Promise<void> {
  const sourcePath = path.join(ROOT, sourceRoot, `${agentName}${extension}`)
  const stat = await fs.stat(sourcePath).catch(() => undefined)
  if (!stat?.isFile()) {
    throw new Error(`Missing source agent: ${sourceRoot}/${agentName}${extension}`)
  }

  await fs.copyFile(sourcePath, path.join(ROOT, targetRoot, `${agentName}${extension}`))
}

for (const platform of PLATFORMS) {
  const targetRoot = path.join(ROOT, platform.target)
  await fs.rm(targetRoot, { recursive: true, force: true })
  await fs.mkdir(targetRoot, { recursive: true })

  for (const skill of platform.skills) {
    await copySkill(skill, platform.target)
  }

  await applyPlatformContent(targetRoot, platform.platform)
  if (platform.platform) {
    await writeProtocolReferences(platform.target, platform.platform)
  }

  console.log(`${platform.name}: synced ${platform.skills.length} skills to ${platform.target}`)
}

for (const target of AGENT_TARGETS) {
  const targetRoot = path.join(ROOT, target.target)
  await fs.rm(targetRoot, { recursive: true, force: true })
  await fs.mkdir(targetRoot, { recursive: true })

  for (const agentName of AUXILIARY_AGENT_NAMES) {
    await copyAgent(agentName, target.extension, target.source, target.target)
  }

  console.log(`${target.name}: synced ${AUXILIARY_AGENT_NAMES.length} agents to ${target.target}`)
}

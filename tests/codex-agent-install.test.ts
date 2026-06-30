import { describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, readFileSync } from "node:fs"
import { rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
  AUXILIARY_AGENT_NAMES,
  CODEX_SKILLS,
  installCodexAgents,
} from "../src/metadata"

const ROOT = process.cwd()

function tempCodexRoot(): string {
  return mkdtempSync(path.join(os.tmpdir(), "cvg-codex-agents-"))
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T
}

describe("Codex agent install", () => {
  test("installs vendored Codex agents and writes a CE-style manifest", async () => {
    const codexRoot = tempCodexRoot()

    try {
      const result = await installCodexAgents({ repoRoot: ROOT, codexRoot })
      const expectedAgents = AUXILIARY_AGENT_NAMES.map((name) => `${name}.toml`).sort()

      expect(result.agents).toEqual(expectedAgents)
      for (const agentFile of expectedAgents) {
        expect(existsSync(path.join(codexRoot, "agents", "convergo", agentFile))).toBe(true)
      }

      expect(readJson(path.join(codexRoot, "convergo", "install-manifest.json"))).toEqual({
        version: 1,
        pluginName: "convergo",
        skills: CODEX_SKILLS,
        prompts: [],
        agents: expectedAgents,
      })
    } finally {
      await rm(codexRoot, { recursive: true, force: true })
    }
  })

  test("cleans only safe stale agent entries from the previous manifest", async () => {
    const codexRoot = tempCodexRoot()
    const agentsRoot = path.join(codexRoot, "agents", "convergo")
    const manifestRoot = path.join(codexRoot, "convergo")
    const unsafeTarget = path.join(codexRoot, "keep.toml")

    try {
      await rm(codexRoot, { recursive: true, force: true })
      await Bun.write(path.join(agentsRoot, "old-agent.toml"), "old")
      await Bun.write(unsafeTarget, "keep")
      await Bun.write(
        path.join(manifestRoot, "install-manifest.json"),
        JSON.stringify({
          version: 1,
          pluginName: "convergo",
          skills: [],
          prompts: [],
          agents: ["old-agent.toml", "../keep.toml"],
        }),
      )

      await installCodexAgents({ repoRoot: ROOT, codexRoot })

      expect(existsSync(path.join(agentsRoot, "old-agent.toml"))).toBe(false)
      expect(readFileSync(unsafeTarget, "utf8")).toBe("keep")
    } finally {
      await rm(codexRoot, { recursive: true, force: true })
    }
  })
})

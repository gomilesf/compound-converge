#!/usr/bin/env bun
import path from "node:path"
import { fileURLToPath } from "node:url"
import { installCodexAgents } from "../src/metadata"

function readCodexRootArg(args: string[]): string | undefined {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === "--codex-home") {
      const value = args[index + 1]
      if (!value) throw new Error("--codex-home requires a path")
      index += 1
      return value
    }
    if (arg === "--help" || arg === "-h") {
      console.log("Usage: bun run install:codex-agents [-- --codex-home <path>]")
      process.exit(0)
    }
    throw new Error(`Unknown argument: ${arg}`)
  }
  return undefined
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const result = await installCodexAgents({
  repoRoot,
  codexRoot: readCodexRootArg(process.argv.slice(2)),
})

console.log(`Installed ${result.agents.length} convergo Codex agents to ${result.agentsRoot}`)
console.log(`Wrote ${result.manifestPath}`)

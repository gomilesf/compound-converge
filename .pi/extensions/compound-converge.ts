import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const extensionDir = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(extensionDir, "../..")
const skillsDir = resolve(packageRoot, "plugins/generic/skills")

export default function compoundConvergePiExtension(pi: any) {
  pi.on("resources_discover", async () => ({
    skillPaths: [skillsDir],
  }))
}

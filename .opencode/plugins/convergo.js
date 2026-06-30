import path from "path"
import { fileURLToPath } from "url"

const pluginDir = path.dirname(fileURLToPath(import.meta.url))
const skillsDir = path.resolve(pluginDir, "../../plugins/generic/skills")

export const CompoundConvergePlugin = async () => ({
  config: async (config) => {
    config.skills = config.skills || {}
    config.skills.paths = config.skills.paths || []
    if (!config.skills.paths.includes(skillsDir)) {
      config.skills.paths.push(skillsDir)
    }
  },
})

export default CompoundConvergePlugin

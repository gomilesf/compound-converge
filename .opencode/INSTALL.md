# Installing Compound Converge for OpenCode

Add Compound Converge to the `plugin` array in your global or project `opencode.json`:

```json
{
  "plugin": ["compound-converge@git+https://github.com/gomilesfd/compound-converge.git"]
}
```

Restart OpenCode after changing the config. The OpenCode plugin registers the base-only generated skills under `plugins/generic/skills`.

## Local Development

From this checkout, point OpenCode at the package path:

```json
{
  "plugin": ["/path/to/compound-converge"]
}
```

Restart OpenCode after changing the package source.

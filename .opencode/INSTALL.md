# Installing Convergo for OpenCode

Add Convergo to the `plugin` array in your global or project `opencode.json`:

```json
{
  "plugin": ["convergo@git+https://github.com/gomilesf/convergo.git"]
}
```

Restart OpenCode after changing the config. The OpenCode plugin registers the base-only generated skills under `plugins/generic/skills`.

## Local Development

From this checkout, point OpenCode at the package path:

```json
{
  "plugin": ["/path/to/convergo"]
}
```

Restart OpenCode after changing the package source.

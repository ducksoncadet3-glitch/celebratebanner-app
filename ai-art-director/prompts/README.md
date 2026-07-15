# prompts/

**Prompt templates as data — never code.** Structured, versioned fragments the
`PromptBuilder` fills deterministically. See `../docs/PROMPT_STRATEGY.md`.

- `templates/*.json` — layered templates with typed slots (`{{goldStandard.*}}`,
  `{{adapter.*}}`, `{{inputs.*}}`, `{{policy.*}}`). Filled, not evaluated.
- Every template is SemVer'd; published versions are immutable.

**Never here:** executable code, API keys, prompts that request licensed logos /
real-person likenesses / synthetic on-image text (text is composited, not generated).

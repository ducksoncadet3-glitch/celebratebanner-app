# Product Adapter Specification

**Deliverable #6.** An **Adapter** is a per-product content pack. It supplies
everything product-specific — wording, decorations, fields, footer values, photo-slot
meanings, and prompt fragments — and **binds** to a Gold Standard for everything
visual. Adding a product = adding an adapter. No pipeline or gold-standard changes.

## 1. Adapter vs Gold Standard (division of labor)

| Adapter owns (content) | Gold Standard owns (look) |
|------------------------|---------------------------|
| Headline/motto/footer wording | Composition, lighting, atmosphere |
| Decorations & motifs (caps, rings, flags…) | Geometry (fractions), print spec |
| Input fields & validation | Palette *rules* |
| Photo-slot *meaning* (hero = grad, = couple…) | Photo-slot *geometry* |
| Prompt fragments (voice, negatives) | Style/composition/print contracts |
| Palette *choices* within the rules | — |

## 2. Structure

```jsonc
{
  "id": "team",
  "version": "1.0.0",
  "displayName": "Team Cinematic Banner",
  "goldStandard": { "id": "premium-cinematic-landscape", "version": "1.0.0" },  // binding

  "fields": [
    { "key": "teamName",   "label": "Team name",   "type": "text", "required": true,  "maxLen": 28 },
    { "key": "sport",      "label": "Sport",        "type": "enum", "required": true,
      "options": ["football","basketball","soccer","volleyball","baseball","softball","hockey","cheer","other"] },
    { "key": "season",     "label": "Season/Year",  "type": "text", "required": false, "maxLen": 12 },
    { "key": "colors",     "label": "Team colors",  "type": "palette", "required": false }
  ],

  "photoSlots": {
    "hero":       { "meaning": "team or key player, full-body preferred", "min": 1, "max": 1 },
    "supporting": { "meaning": "teammates / action shots", "min": 0, "max": 7 }
  },

  "content": {
    "mottos": {
      "football": "Leave it all on the field",
      "basketball": "Own the court",
      "soccer": "Rule the pitch",
      "other": "Give it everything out there"
    },
    "footerIcons": [
      { "key": "TEAMWORK",   "subtitle": "One unit" },
      { "key": "DISCIPLINE", "subtitle": "Every rep" },
      { "key": "LEADERSHIP", "subtitle": "Set the tone" },
      { "key": "UNITY",      "subtitle": "One family" },
      { "key": "VICTORY",    "subtitle": "Earned, not given" }
    ],
    "decorations": ["stadium-atmosphere", "field-lights", "gold-particles"]
  },

  "palette": { "primaryFrom": "colors", "accent": "#C9A84C" },  // choices within GS rules

  "promptFragments": {
    "voice": "high-energy athletic tribute; cinematic stadium atmosphere; pride and grit",
    "negatives": "no team logos, no league marks, no real player likenesses, no jersey numbers of real athletes"
  }
}
```

This mirrors the existing `design-references/products/team-cinematic-v1.json`
(sport-aware mottos, footer icons, role mapping) restated as a pipeline adapter.

## 3. Required adapters (design targets)

Each ships its own `v1.json` + validates against the shared `adapters/*/schema.json`:

| Product | Hero meaning | Voice (one line) | Key negatives |
|---------|--------------|------------------|---------------|
| **Graduation** | The graduate | proud, aspirational, editorial | no school logos/seals |
| **Team Sports** | Team / key player | athletic, cinematic, gritty | no logos/likenesses/league marks |
| **Wedding** | The couple | romantic, timeless, elegant | no religious marks unless requested |
| **Family Legacy** | The family | warm, generational, heirloom | — |
| **Memorial** | The remembered | reverent, gentle, dignified | nothing macabre; tasteful only |
| **Patriotic** | Honoree / subject | dignified, spirited | no partisan/political symbols |
| *Future* | *defined per adapter* | *…* | *…* |

Only Graduation and Team have example instances in this milestone; the rest are
specified here and stubbed as folders to be filled by dropping in an adapter.

## 4. Rules

1. **Content only.** No geometry, lighting, or print spec — those come from the bound
   gold standard. A field that changes the *look* belongs in the gold standard.
2. **Must bind** to an existing `{goldStandard.id, version}`.
3. **Palette by choice within rules.** Adapter picks colors; gold standard enforces
   contrast/CMYK-safety.
4. **Carries its own negatives** (layer 6 of the prompt) for product-specific safety.
5. **Immutable once published** — new content ships as a new adapter version.
6. **No licensed content**, consistent with the existing Team/Champions rule.

## 5. Adding a new product (checklist)

1. Copy an adapter folder, set `id`/`displayName`.
2. Bind to a gold standard `{id, version}`.
3. Define `fields`, `photoSlots`, `content`, `palette`, `promptFragments`.
4. Validate against `adapters/<id>/schema.json`.
5. Register in the adapter index; no code changes required.

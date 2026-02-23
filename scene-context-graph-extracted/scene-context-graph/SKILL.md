---
name: scene-context-graph
description: >
  Reference skill for Promad's animated background scene system. Contains the full taxonomy of 8 background types (liquid, fluid, ribbon, aurora, waves, dandelion, simple, particleRing), effect layers (texture, color map, fluted glass, vignette, blur), color system, configuration schema, naming conventions, complexity scoring, and pattern recipes for 223+ catalogued scenes.

  Use this skill whenever the user mentions scenes, backgrounds, effects, scene configs, background types, color palettes for scenes, complexity scores, the context graph, or anything related to creating, modifying, recommending, or analyzing animated background scenes. Also trigger when the user asks about ribbons, aurora, fluid effects, liquid backgrounds, particle rings, dandelion effects, fluted glass, vignette settings, or scene JSON configuration. Even casual mentions like "make a new scene", "which background should I use", "scene recommendations", or "update the scene settings" should trigger this skill.
---

# Scene Context Graph — Promad Background Scene System

You are working with Promad's animated background scene system. This skill gives you the complete knowledge base for creating, analyzing, recommending, and configuring scenes. The catalog currently has 223+ scenes across 8 background types.

Ground all recommendations in the data and patterns documented here. For deep reference on any section, read the corresponding file in `references/`.

## Scene Taxonomy (8 Background Types)

| Type | Count | Share | Default BG | Best For | Complexity |
|------|-------|-------|------------|----------|------------|
| **liquid** | 43 | 19.3% | #000000 | Creative portfolios, luxury brands | 28-40 |
| **fluid** | 41 | 18.4% | #1C89FF | Tech headers, SaaS dashboards | 22-28 |
| **ribbon** | 41 | 18.4% | #ffffff | Elegant headers, premium interfaces | 18-26 |
| **aurora** | 36 | 16.1% | #000000 | Atmospheric, premium SaaS, agencies | 28-38 |
| **waves** | 23 | 10.3% | blue/teal | Marine themes, dynamic illustrations | 18-26 |
| **dandelion** | 16 | 7.2% | warm tones | Wellness, lifestyle, gentle backgrounds | 14-22 |
| **simple** | 14 | 6.3% | varies | Accessible, text-heavy, subtle | 6-15 |
| **particleRing** | 9 | 4.0% | #000000 | Sci-fi, futuristic, data viz | 22-30 |

### Choosing a Type

- Modern/tech-focused → **fluid** (dynamic transitions), **particleRing** (sci-fi), or **aurora** (premium atmospheric)
- Elegant/premium → **ribbon** (light background) or **aurora** (dark/moody)
- Organic/nature feel → **dandelion** (gentle/subtle) or **liquid** (morphing/abstract)
- Wave/motion pattern → **waves**
- Minimal/accessible fallback → **simple**

## Effect Layer System

Six independent, stackable effect channels applied on top of the background type.

**Textures:** grain (39 scenes, film warmth, best with liquid/aurora) · scanlines (33, CRT retro, best with fluid/particleRing) · diagonal (31, modern geometric) · dots (29, playful, best with simple/ribbon) · grid (29, tech/structured) · none (62, clean look). Use 40-60% opacity. Pick one or none — never stack textures.

**Color Maps:** none (186) · vintage (13) · sunset (12) · cyberpunk (6) · matrix (3) · sepia (2) · noir (1). Use "none" for maximum color flexibility. Apply cyberpunk only for tech/gaming contexts.

**Fluted Glass:** Enabled in 41% of scenes. Avg rotation 65°, avg segments 84. Creates premium glass refraction depth. Disable when text readability is critical. Higher segments = slower rendering.

**Vignette:** 39.5% of scenes, avg intensity 0.33. Use 0.2-0.4 for subtle depth. Values >0.6 feel heavy. Pairs well with liquid and aurora.

**Blur:** Range 0-30, avg 5.17. Fluid is the outlier (30-40 blur built into its simulation). Other types: 3-15 typical. Blur >20 significantly impacts mobile performance. Sweet spot: 3-8 for quality/performance balance.

**Brightness/Contrast/Saturation:** Fine-tuning. Brightness ±0.3, Contrast 0.8-1.3, Saturation 0.7-1.3 (all neutral at defaults). Desaturate for vintage, boost saturation for vibrant.

For full parameter ranges and type-specific recommendations, read `references/effects_reference.md`.

## Color System

**Top Colors:** #71ECFF (cyan, dominant), #000000 (black), #3b82f6 (blue), #a855f7 (purple), #06b6d4 (teal), #1C89FF (fluid default)

**Default Template Colors** (present in all scene configs as fallbacks):
#39F58A (green) · #F0CBA8 (warm cream) · #ec4899 (pink) · #40204c (deep purple) · #a3225c (burgundy) · #e24926 (burnt orange) · #152a8e (deep blue)

**Background Color Conventions:**
- Dark types (liquid, aurora, particleRing) → default #000000
- Light types (ribbon) → default #ffffff
- Blue types (fluid, waves) → default #1C89FF
- Warm types (dandelion) → warm/neutral tones

**Text Colors:** White (40%, for dark BGs) · Yellow (21.5%, warm accent on dark) · Black (14%, for light BGs). Minimum contrast ratio 4.5:1 (WCAG AA).

**Color Palette Structure:** Each scene uses shades 50-950 (11 levels). 50-300 = light variants, 400-600 = mid-tones, 700-950 = dark variants.

## Complexity Scoring (6-52)

```
score = 6 (base)
  + (effectCount × 2)
  + (blur / 3)
  + (hasTexture × 1.5)
  + (animationLayers × 3)
  + (colorMapComplexity × 1)
  + (hasVignette × 1)
  + (hasFlutedGlass × 2)
  capped at 52
```

| Range | Category | FPS Target | Use Case |
|-------|----------|------------|----------|
| 6-15 | Minimal | 60fps everywhere | Text-heavy, accessible |
| 16-25 | Moderate | 60fps desktop, 30fps mobile | Standard pages, headers |
| 26-35 | Rich | 60fps desktop, variable mobile | Premium showcase |
| 36-52 | Immersive | Desktop only reliable | Cinematic full-page hero |

**Default target for new scenes:** 18-25 (moderate).

## Pattern Recipes

These are proven effect+type combinations from the catalog:

**Clean Tech** — fluid + scanlines/grid + blur 8-12 + no vignette → complexity 22-28. Blues/cyans. For SaaS/tech dashboards.

**Premium Organic** — liquid or aurora + grain + vintage/sunset colorMap + blur 10-15 + vignette 0.3-0.4 + fluted glass → complexity 28-36. Warm tones, purples. For luxury/creative portfolios.

**Elegant Minimal** — ribbon or simple + no texture + no colorMap + blur 3-8 → complexity 12-20. White/black + one accent. For corporate/professional.

**Atmospheric Cinematic** — aurora + grain + blur 15-25 + vignette 0.35-0.45 → complexity 30-40. Purple-to-cyan gradients. For creative agencies, immersive hero sections.

**Dynamic Energy** — fluid or particleRing + diagonal/grid + blur 5-10 → complexity 24-32. Neon palette, pink/cyan. For gaming/startups.

**Subtle Texture** — simple or dandelion + dots/grain + blur 2-5 → complexity 10-18. Warm neutrals, pastels. For wellness/lifestyle.

For step-by-step recreation instructions, read `references/pattern_recipes.md`.

## Configuration Schema

Each scene JSON has this structure:

- `backgroundType` — one of the 8 types
- Type-specific config — `blobConfig` (liquid), `fluidConfig`, `wavesConfig`, `auroraConfig`, `ribbonConfig`, `dandelionConfig`, `particleRingConfig`, `gradientConfig`/`tessellationConfig` (simple)
- `effectsConfig` — blur, texture, colorMap, flutedGlass{enabled, rotation, segments}, vignetteIntensity, brightness, contrast, saturation
- `textConfig` — color, enabled, opacity
- `colorPalette` — named palette with shades 50-950
- `textSections` — positioned text content blocks
- `selectedProjectIds` — linked project UUIDs

For the complete schema with all field types, value ranges, and defaults for each config type, read `references/config_schema.md`.

## Context Graph Architecture

The internal knowledge graph connects scenes through 6 node types and 9 relationship types:

**Nodes:** Scene, BackgroundType, Effect, ColorPalette, Mood, UseCase

**Relationships:**
- `IS_TYPE` (Scene → BackgroundType, 1:1)
- `USES_EFFECT` (Scene → Effect, with intensity property)
- `HAS_COLOR` (Scene → ColorPalette, 1:1)
- `MATCHES_MOOD` (Scene → Mood, with matchScore)
- `SUITED_FOR` (Scene → UseCase, with suitabilityScore)
- `RELATED_TO` (Scene → Scene, with similarity + commonReason)
- `CONFLICTS_WITH` (Effect → Effect, incompatible combos like grain + dots)
- `COMPLEMENTS` (Effect → Effect, synergistic combos like scanlines + particleRing)
- `ENHANCES` (BackgroundType → Effect, type-specific effect affinities)

For full node properties, relationship semantics, and traversal query examples, read `references/context_graph_schema.md`.

## Naming Conventions

**Template:** `[Type] [Mood/Style] [Primary Feature]`
Examples: "Liquid Cyan Morph Gradient", "Aurora Dark Ethereal Northern Lights", "Ribbon Elegant Wave Flow White"

**Tags:** Always include type name, primary color, mood, use case. Aim for 4-6 tags per scene.

**Top Keywords:** gradient (294), design (280), background (256), dark (118), web (98), modern (81), abstract (74), elegant (58), digital (54)

**Complexity-based naming emphasis:**
- 6-15: use "minimal", "subtle", "elegant"
- 16-25: standard descriptive
- 26-35: use "dynamic", "intricate", "detailed"
- 36-52: use "immersive", "cinematic", "elaborate"

## Quality Checklist

Before publishing any scene, verify:

1. Valid backgroundType (one of 8), all required fields present, params within ranges
2. Renders without glitches, smooth animation loop
3. Text contrast >= 4.5:1 (WCAG AA), legible at all tested sizes
4. 60fps desktop, 30fps+ mobile minimum
5. Name follows `[Type] [Mood] [Feature]` template, 4-6 tags
6. No conflicting effects (e.g., grain + dots texture)
7. Complete color palette (all 11 shades, coherent gradient)
8. Complexity score matches actual visual richness
9. Accessibility: no >3Hz flashing, pausable animation

For the full detailed checklist with all categories, read `references/quality_checklist.md`.

## Bulk Create API

Scenes can be created programmatically via the bulk-create REST endpoint. Supports batch creation with per-scene error handling, optional project linking, and thumbnail URL references.

**Endpoint:** `POST /api/bulk-create-scenes` (password-protected)

**Key features:**
- Batch insert multiple scenes in a single request (50 MB max)
- Optional `projectId` to link all scenes to a project
- Per-scene success/failure reporting in response
- Auto-generates slugs from titles

For the full API reference with request/response schema, authentication, usage examples, and error codes, read `references/bulk_create_api.md`.

# Quality Checklist — Full Pre-Publication Review

## 1. Configuration Validity
- [ ] backgroundType is one of: liquid, fluid, ribbon, aurora, waves, dandelion, simple, particleRing
- [ ] All required fields present and non-empty in scene_data
- [ ] Numeric parameters within documented ranges (see config_schema.md)
- [ ] No syntax errors in JSON structure
- [ ] Color values are valid hex codes (#RRGGBB or #RGB format)
- [ ] Complexity score calculated correctly and within 6-52
- [ ] Only one colorMap applied (not multiple)
- [ ] Only one texture applied (not multiple)

## 2. Visual Quality
- [ ] Scene renders without graphical glitches or artifacts
- [ ] Animation loops smoothly without visible stutter or seams
- [ ] Colors are vibrant and properly distributed across the canvas
- [ ] Texture (if enabled) enhances the scene without overwhelming it
- [ ] Blur settings don't obscure important visual elements
- [ ] Vignette (if enabled) frames content naturally without heavy edges
- [ ] Fluted glass (if enabled) adds depth without distorting content

## 3. Text Readability
- [ ] Text color contrast ratio >= 4.5:1 against background (WCAG AA)
- [ ] Text is legible at all tested viewport sizes
- [ ] Font size appropriate for content hierarchy
- [ ] Text doesn't disappear behind animation elements
- [ ] Text overlay disabled if not needed for the scene
- [ ] Font family is web-safe or properly loaded via CDN

## 4. Performance
- [ ] Renders at 60fps on desktop test devices
- [ ] Renders at 30fps minimum on mid-range mobile (if mobile use case)
- [ ] GPU memory usage under 100MB
- [ ] No memory leaks over 5 minutes continuous playback
- [ ] Blur >20 tested with acceptable frame rate
- [ ] Fluted glass segments optimized (60-100 range preferred)
- [ ] Complexity score aligns with target performance tier

## 5. Naming & Documentation
- [ ] Scene title follows template: [Type] [Mood/Style] [Primary Feature]
- [ ] short_description is 1 sentence, informative
- [ ] long_description is 1-3 sentences with visual description + use case
- [ ] Tags include: type name, primary color, mood, use case (4-6 total)
- [ ] Keywords drawn from established vocabulary (gradient, design, modern, etc.)
- [ ] No typos in title, slug, or descriptions
- [ ] Complexity score label matches visual richness (minimal/moderate/rich/immersive)

## 6. Accessibility
- [ ] No flashing elements exceeding 3 flashes per second
- [ ] Color is not the sole conveyor of information
- [ ] Sufficient contrast for users with color vision deficiency
- [ ] Text alternatives provided where content depends on visual
- [ ] Animation supports prefers-reduced-motion media query (if implemented)
- [ ] Scene remains usable with high contrast mode enabled

## 7. Effect Combinations
- [ ] No conflicting effects active together (e.g., grain + dots)
- [ ] Total active effect layers don't exceed 6
- [ ] Texture and colorMap don't compete for visual attention
- [ ] Fluted glass rotation is in natural range (45-90° preferred)
- [ ] Every enabled effect serves a clear purpose
- [ ] Effect intensities balanced (no single effect overwhelming others)

## 8. Color System
- [ ] colorPalette is complete (all 11 shades: 50-950)
- [ ] Shades form a coherent gradient from light to dark
- [ ] Palette name is descriptive and matches the color family
- [ ] Background color follows type convention (see SKILL.md Color System)
- [ ] Text color appropriate for background luminosity
- [ ] No deprecated or invalid color values

## 9. Metadata & Catalog
- [ ] created_at timestamp is accurate
- [ ] Slug is URL-safe and unique within catalog
- [ ] selectedProjectIds reference valid projects
- [ ] No duplicate scenes in catalog (check by visual similarity)
- [ ] Scene ID is a valid UUID

## Review Sign-Off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Designer | | | [ ] |
| Technical Lead | | | [ ] |
| QA Specialist | | | [ ] |
| Content Manager | | | [ ] |

All four approvals required before publication.

# Effects Reference — Full Parameter Guide

## Texture Effects

### grain
- Scene count: 39 (17.5%)
- Visual: Film grain noise overlay creating warmth and analog feel
- Best with: liquid, aurora (warm organic types)
- Texture size: 20-40 typical
- Opacity: 40-60% for subtle effect
- Blend mode: overlay (default) or multiply for heavier grain
- Performance: Low impact

### scanlines
- Scene count: 33 (14.8%)
- Visual: CRT monitor horizontal lines, retro tech aesthetic
- Best with: fluid, particleRing (tech-oriented types)
- Texture size: 15-30 typical
- Opacity: 30-50% (too high becomes distracting)
- Blend mode: overlay
- Performance: Low impact

### diagonal
- Scene count: 31 (13.9%)
- Visual: Diagonal line pattern, modern geometric feel
- Best with: particleRing, waves
- Texture size: 25-45 typical
- Opacity: 30-50%
- Blend mode: overlay
- Performance: Low impact

### dots
- Scene count: 29 (13.0%)
- Visual: Polka dot halftone pattern, playful/artistic
- Best with: simple, ribbon (lighter, cleaner types)
- Texture size: 20-40 typical
- Opacity: 30-50%
- Blend mode: overlay
- Performance: Low impact
- Note: CONFLICTS_WITH grain (overlapping noise patterns)

### grid
- Scene count: 29 (13.0%)
- Visual: Grid line overlay, structured/technical feel
- Best with: fluid, particleRing
- Texture size: 30-50 typical (larger for visible grid)
- Opacity: 20-40% (keep subtle)
- Blend mode: overlay
- Performance: Low impact

### none
- Scene count: 62 (27.8%)
- Visual: Clean, no texture overlay
- Use: When the background animation alone is enough or text readability is top priority

## Color Maps

### none (default)
- Scene count: 186 (83.4%)
- Use: Original colors untouched. Best for maximum palette flexibility.

### vintage
- Scene count: 13
- Visual: Faded warm tones, desaturated, nostalgic feel
- Best complexity: 20-35
- Best types: liquid, ribbon, aurora
- Pairs with: grain texture for full analog look

### sunset
- Scene count: 12
- Visual: Warm oranges, reds, golden tones
- Best complexity: 15-30
- Best types: liquid, ribbon, waves
- Pairs with: vignette for dreamy depth

### cyberpunk
- Scene count: 6
- Visual: Neon pink/cyan high contrast, synthetic feel
- Best complexity: 25-45
- Best types: fluid, particleRing
- Pairs with: scanlines or grid for full cyberpunk aesthetic

### matrix
- Scene count: 3
- Visual: Green monochrome, digital rain vibe
- Best complexity: 20-35
- Best types: particleRing, fluid
- Pairs with: grid texture

### sepia
- Scene count: 2
- Visual: Brown vintage tone, photographic aging
- Best complexity: 10-25
- Best types: simple, dandelion

### noir
- Scene count: 1
- Visual: High contrast black & white
- Best complexity: 15-30
- Best types: ribbon, aurora

## Fluted Glass — Detailed Parameters

Optical glass refraction that adds depth and premium feel.

| Parameter | Range | Recommended | Notes |
|-----------|-------|-------------|-------|
| enabled | boolean | — | Toggle on/off |
| rotation | 0-360° | 45-90° | Natural appearance range |
| segments | 10-200 | 60-100 | Visual quality sweet spot |
| motionSpeed | 0-5 | 0.5-1.5 | Subtle motion preferred |
| motionValue | 0-10 | 0-2 | Keep low for elegance |
| waveFrequency | 0-10 | 0.5-2 | Refraction wave frequency |
| overlayOpacity | 0-100 | 5-20 | Lower = more subtle |
| distortionStrength | 0-1 | 0-0.1 | Very sensitive parameter |

**Cross-correlation by type:**
- ribbon: 22 scenes with fluted glass (54% of ribbon scenes)
- aurora: 18 scenes (50%)
- fluid: 16 scenes (39%)
- liquid: 14 scenes (33%)
- waves: 10 scenes (43%)
- dandelion: 6 scenes (38%)
- simple: 4 scenes (29%)
- particleRing: 2 scenes (22%)

## Vignette — Usage Patterns

| Intensity | Count | Use Case |
|-----------|-------|----------|
| 0 (off) | 135 | Clean/flat scenes |
| 0.1-0.2 | 22 | Very subtle depth |
| 0.2-0.4 | 48 | Standard depth (recommended) |
| 0.4-0.6 | 14 | Strong focus framing |
| 0.6+ | 4 | Very heavy (use sparingly) |

**Best pairings:** liquid + vignette 0.3, aurora + vignette 0.35

## Blur — Type-Specific Recommendations

| Type | Recommended Blur | Why |
|------|-----------------|-----|
| liquid | 5-15 | Softens blob edges |
| fluid | 30-40 | Built into fluid simulation aesthetic |
| ribbon | 3-8 | Keeps ribbon definition |
| aurora | 10-20 | Enhances light glow |
| waves | 3-10 | Maintains wave clarity |
| dandelion | 5-15 | Softens particles naturally |
| simple | 0-5 | Keep gradients sharp |
| particleRing | 3-10 | Balance glow vs definition |

## Effect Stacking Rules

### Conflicting Combinations (avoid)
- grain + dots (overlapping noise patterns create visual mud)
- cyberpunk colorMap + vintage colorMap (only one colorMap at a time anyway)
- High blur (>20) + fluted glass (compounds performance cost)
- Heavy vignette (>0.5) + heavy blur (>15) (excessive darkness at edges)

### Synergistic Combinations (recommended)
- scanlines + fluid/particleRing (tech aesthetic amplified)
- grain + vignette (cinematic/premium feel)
- fluted glass + aurora (premium glass + northern lights = luxury)
- diagonal + waves (geometric motion pattern)
- sunset colorMap + ribbon on dark BG (warm elegant flow)

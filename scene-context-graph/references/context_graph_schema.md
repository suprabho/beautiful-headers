# Context Graph Schema — Full Reference

## Node Types

### Scene
Represents an individual background scene configuration.

| Property | Type | Description |
|----------|------|-------------|
| id | string (UUID) | Unique identifier |
| title | string | Human-readable name |
| slug | string | URL-safe identifier |
| backgroundType | enum | One of 8 types |
| complexity | number (6-52) | Complexity score |
| created_at | timestamp | Creation date |
| updated_at | timestamp | Last modification |
| short_description | string | 1-sentence summary |
| long_description | string | 1-3 sentence description |
| tags | string[] | Associated tags |

### BackgroundType
Represents one of the 8 background type categories.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Type identifier (liquid, fluid, etc.) |
| displayName | string | Capitalized display name |
| count | number | Scenes of this type |
| percentage | number | Share of catalog |
| avgComplexity | number | Average scene complexity |
| defaultBgColor | hex | Default background color |
| typicalUseCase | string | Primary use case |

### Effect
Represents a visual effect layer.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Effect identifier |
| category | enum | texture, colorMap, flutedGlass, vignette, blur |
| name | string | Display name |
| description | string | What the effect does |
| sceneCount | number | How many scenes use it |
| avgIntensity | number | Average intensity when used |
| performanceImpact | enum | low, medium, high |

### ColorPalette
Represents a color configuration.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Palette identifier |
| name | string | Palette name (e.g., "lime", "amber") |
| shades | object | Map of shade levels 50-950 to hex values |
| mood | string | Associated mood/style |
| usageCount | number | Scenes using this palette |

### Mood
Represents an aesthetic or mood category.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Mood identifier |
| name | string | Mood name |
| keywords | string[] | Associated keywords |
| associatedTypes | string[] | Matching background types |
| complexityRange | [min, max] | Recommended complexity |

Known moods from catalog analysis:
- **dark** (118 scenes) — liquid, aurora, particleRing
- **modern** (81) — fluid, particleRing, waves
- **abstract** (74) — liquid, fluid, aurora
- **elegant** (58) — ribbon, aurora
- **digital** (54) — fluid, particleRing
- **gradient** (294 keyword occurrences) — all types
- **web** (98) — all types

### UseCase
Represents an application context.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Use case identifier |
| name | string | Use case name |
| description | string | Context description |
| recommendedTypes | string[] | Best scene types |
| complexityRange | [min, max] | Recommended range |
| readabilityTips | string[] | Content placement guidance |

Known use cases:
- **Hero Section** — aurora, liquid, fluid (complexity 26-40)
- **SaaS Dashboard** — fluid, simple (complexity 16-25)
- **Creative Portfolio** — liquid, aurora (complexity 28-38)
- **Corporate/Professional** — ribbon, simple (complexity 12-22)
- **E-commerce Product** — liquid, ribbon (complexity 20-32)
- **Wellness/Lifestyle** — dandelion, simple (complexity 10-18)
- **Gaming/Tech** — particleRing, fluid (complexity 24-35)
- **Blog Header** — waves, ribbon (complexity 16-25)

## Relationship Types

### IS_TYPE
- Direction: Scene → BackgroundType
- Cardinality: 1:1 (every scene has exactly one type)
- Properties: none
- Example: `Scene("Aurora Ethereal") -[IS_TYPE]-> BackgroundType("aurora")`

### USES_EFFECT
- Direction: Scene → Effect
- Cardinality: 1:many (a scene can use multiple effects)
- Properties: `intensity` (number, 0-1 normalized)
- Example: `Scene("Premium Glow") -[USES_EFFECT {intensity: 0.35}]-> Effect("vignette")`

### HAS_COLOR
- Direction: Scene → ColorPalette
- Cardinality: 1:1
- Properties: none
- Example: `Scene("Warm Liquid") -[HAS_COLOR]-> ColorPalette("amber")`

### MATCHES_MOOD
- Direction: Scene → Mood
- Cardinality: 1:many (a scene can match multiple moods)
- Properties: `matchScore` (number, 0-1 confidence)
- Example: `Scene("Aurora Ethereal") -[MATCHES_MOOD {matchScore: 0.92}]-> Mood("elegant")`
- Derivation: Based on title keywords, background type, complexity range, and color temperature

### SUITED_FOR
- Direction: Scene → UseCase
- Cardinality: 1:many
- Properties: `suitabilityScore` (number, 0-1)
- Example: `Scene("Fluid Tech Blue") -[SUITED_FOR {suitabilityScore: 0.88}]-> UseCase("SaaS Dashboard")`
- Derivation: Based on type affinity, complexity match, and color appropriateness

### RELATED_TO
- Direction: Scene → Scene (bidirectional)
- Cardinality: many:many
- Properties: `similarity` (number, 0-1), `commonReason` (string)
- Example: `Scene("Aurora A") -[RELATED_TO {similarity: 0.78, commonReason: "same type + warm colors"}]-> Scene("Aurora B")`
- Derivation: Scenes sharing backgroundType + similar color palette + similar effects

### CONFLICTS_WITH
- Direction: Effect → Effect (bidirectional)
- Cardinality: many:many
- Properties: `reason` (string)
- Known conflicts:
  - grain ↔ dots: "overlapping texture noise patterns"
  - high blur (>20) ↔ fluted glass: "compounds rendering cost"
  - heavy vignette (>0.5) ↔ heavy blur (>15): "excessive edge darkness"

### COMPLEMENTS
- Direction: Effect → Effect (bidirectional)
- Cardinality: many:many
- Properties: `synergy` (number, 0-1)
- Known complements:
  - scanlines + particleRing: synergy 0.9
  - grain + vignette: synergy 0.85
  - fluted glass + aurora: synergy 0.88
  - diagonal + waves: synergy 0.75

### ENHANCES
- Direction: BackgroundType → Effect
- Cardinality: many:many
- Properties: `enhancementScore` (number, 0-1)
- Known enhancements:
  - fluid → scanlines (0.85)
  - aurora → grain (0.82)
  - aurora → fluted glass (0.88)
  - ribbon → fluted glass (0.80)
  - liquid → vignette (0.83)
  - particleRing → grid (0.78)

## Traversal Query Examples

### Find premium scenes for product showcases
```
MATCH (s:Scene)-[:MATCHES_MOOD]->(m:Mood {name: "elegant"})
WHERE s.complexity >= 28 AND s.complexity <= 35
AND (s)-[:SUITED_FOR]->(:UseCase {name: "E-commerce Product"})
RETURN s.title, s.complexity, s.backgroundType
```

### Find which effects work best with a given type
```
MATCH (t:BackgroundType {id: "aurora"})-[:ENHANCES {enhancementScore: score}]->(e:Effect)
WHERE score > 0.7
RETURN e.name, score
ORDER BY score DESC
```

### Find similar scenes to a given scene
```
MATCH (s1:Scene {id: "target-uuid"})-[:RELATED_TO {similarity: sim}]->(s2:Scene)
WHERE sim > 0.7
RETURN s2.title, sim, s2.backgroundType
ORDER BY sim DESC
```

### Find conflicting effects in a scene
```
MATCH (s:Scene {id: "target-uuid"})-[:USES_EFFECT]->(e1:Effect)
MATCH (e1)-[:CONFLICTS_WITH]->(e2:Effect)<-[:USES_EFFECT]-(s)
RETURN e1.name, e2.name, e1.reason
```

### Find under-represented type+effect combinations
```
MATCH (t:BackgroundType)-[:ENHANCES]->(e:Effect)
WITH t, e, SIZE((t)<-[:IS_TYPE]-(:Scene)-[:USES_EFFECT]->(e)) as count
WHERE count < 3
RETURN t.id, e.name, count
```

# Bulk Create Scenes API

Create multiple scenes at once by POSTing JSON data.

## Endpoint

```
POST /api/bulk-create-scenes
```

## Authentication

All requests require the admin password (same one used for deleting scenes).

## Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "password": "your-admin-password",
  "scenes": [
    {
      "title": "Ocean Gradient Header",
      "scene_data": {
        "backgroundType": "liquid",
        "gradientConfig": {
          "colors": ["#0a1628", "#1a3a5c", "#2d6a9f"],
          "numColors": 3,
          "type": "radial",
          "waveIntensity": 0.5,
          "mouseInfluence": 0.3
        },
        "effectsConfig": {
          "blur": 0,
          "texture": "none",
          "saturation": 100,
          "contrast": 100,
          "brightness": 100
        },
        "textSections": [],
        "textGap": 16,
        "textConfig": { "enabled": false, "color": "#ffffff", "opacity": 1 }
      },
      "short_description": "A calming ocean gradient with deep blue tones",
      "long_description": "Deep navy and ocean blue gradient header...",
      "thumbnail": {
        "small": "https://example.com/thumb-small.jpg",
        "medium": "https://example.com/thumb-medium.jpg",
        "large": "https://example.com/thumb-large.jpg",
        "full": "https://example.com/thumb-full.jpg"
      }
    }
  ]
}
```

### Scene Fields

| Field | Required | Description |
|---|---|---|
| `title` | Yes | Scene title (slug is auto-generated from this) |
| `scene_data` | Yes | Full scene configuration object |
| `short_description` | No | Short SEO description |
| `long_description` | No | Detailed description |
| `thumbnail` | No | Object with `small`, `medium`, `large`, `full` image URLs |
| `created_at` | No | ISO timestamp (defaults to now) |

### `scene_data` Structure

The `scene_data` object configures everything about the scene. The key field is `backgroundType`, which determines which config block is active.

**Background types:** `simple`, `liquid`, `aurora`, `fluid`, `waves`, `ribbon`, `dandelion`, `particleRing`, `shapeTrail`

Each type has its own config key (e.g., `gradientConfig`, `auroraConfig`, `fluidConfig`, etc.). The easiest way to get valid `scene_data` is to export existing scenes using the export script and use those as templates.

## Response

```json
{
  "summary": {
    "total": 3,
    "created": 2,
    "failed": 1
  },
  "results": [
    { "index": 0, "title": "Ocean Gradient", "slug": "ocean-gradient", "id": "uuid-1", "success": true },
    { "index": 1, "title": "Sunset Glow", "slug": "sunset-glow", "id": "uuid-2", "success": true },
    { "index": 2, "title": null, "success": false, "error": "Missing required fields: title and scene_data" }
  ]
}
```

## Usage Examples

### cURL

```bash
curl -X POST https://your-domain.vercel.app/api/bulk-create-scenes \
  -H "Content-Type: application/json" \
  -d '{
    "password": "your-password",
    "scenes": [
      {
        "title": "My Scene",
        "scene_data": { "backgroundType": "liquid", "gradientConfig": { "colors": ["#ff0000", "#0000ff"] } }
      }
    ]
  }'
```

### JavaScript (fetch)

```js
const response = await fetch('/api/bulk-create-scenes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    password: 'your-password',
    scenes: [
      {
        title: 'My Scene',
        scene_data: { backgroundType: 'liquid', gradientConfig: { colors: ['#ff0000', '#0000ff'] } },
      },
    ],
  }),
})

const result = await response.json()
console.log(result.summary) // { total: 1, created: 1, failed: 0 }
```

### Re-importing Exported Scenes

You can round-trip scenes using the existing export script:

```bash
# 1. Export all scenes
node export-scenes.mjs

# 2. Edit scenes_export_light.json as needed

# 3. Re-import (wrap the array in the expected format)
node -e "
const fs = require('fs');
const scenes = JSON.parse(fs.readFileSync('scenes_export_light.json', 'utf8'));
fetch('https://your-domain.vercel.app/api/bulk-create-scenes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'your-password', scenes })
}).then(r => r.json()).then(console.log);
"
```

## Error Codes

| Status | Meaning |
|---|---|
| 200 | Request processed (check `results` for per-scene status) |
| 400 | Missing or empty `scenes` array |
| 401 | No password provided |
| 403 | Invalid password |
| 405 | Wrong HTTP method (only POST allowed) |

## Limits

- Max request body size: **50 MB**
- Scenes are inserted one-by-one so a single failure won't roll back others
- Thumbnails are stored as URL references only — this endpoint does **not** upload image files to storage. To generate thumbnails, open each scene in the editor and use the recapture thumbnail feature.

# Pattern Recipes — Step-by-Step Scene Creation

## Recipe 1: Clean Tech

**Goal:** Modern tech background for SaaS dashboard or developer tool header.

**Step 1 — Set type:**
```json
"backgroundType": "fluid"
```

**Step 2 — Configure fluid:**
```json
"fluidConfig": {
  "speed": 0.8,
  "colors": ["#71ECFF", "#3b82f6", "#06b6d4", "#1C89FF"],
  "intensity": 2.2,
  "blurAmount": 35,
  "backgroundColor": "#1C89FF",
  "useGradientColors": true
}
```

**Step 3 — Set effects:**
```json
"effectsConfig": {
  "blur": 10,
  "texture": "scanlines",
  "colorMap": "none",
  "textureSize": 25,
  "textureOpacity": 35,
  "textureBlendMode": "overlay",
  "vignetteIntensity": 0,
  "flutedGlass": { "enabled": false },
  "contrast": 100,
  "brightness": 100,
  "saturation": 100
}
```

**Step 4 — Colors:** Blues and cyans (#1C89FF, #3b82f6, #06b6d4, #71ECFF)
**Step 5 — Text:** White (#ffffff) on the blue background, opacity 0.85
**Step 6 — Tags:** fluid, tech, scanlines, blue, dashboard, modern
**Target complexity:** 22-28

---

## Recipe 2: Premium Organic

**Goal:** Luxurious atmosphere for creative portfolio or premium brand.

**Step 1 — Set type:**
```json
"backgroundType": "liquid"
```

**Step 2 — Configure blobs:**
```json
"blobConfig": {
  "speed": 0.5,
  "colors": ["#40204c", "#a3225c", "#e24926"],
  "blobCount": 5,
  "maxRadius": 120,
  "minRadius": 40,
  "threshold": 180,
  "blurAmount": 12,
  "decaySpeed": 0.95,
  "orbitRadius": 150,
  "mouseInfluence": 0.3,
  "backgroundColor": "#152a8e",
  "useGradientColors": true
}
```

**Step 3 — Set effects:**
```json
"effectsConfig": {
  "blur": 12,
  "texture": "grain",
  "colorMap": "vintage",
  "textureSize": 30,
  "textureOpacity": 45,
  "textureBlendMode": "overlay",
  "vignetteIntensity": 35,
  "flutedGlass": {
    "enabled": true,
    "rotation": 75,
    "segments": 85,
    "motionSpeed": 1,
    "overlayOpacity": 11,
    "distortionStrength": 0.02
  },
  "contrast": 105,
  "brightness": 100,
  "saturation": 110
}
```

**Step 4 — Colors:** Warm purples, burgundy, burnt orange
**Step 5 — Text:** Yellow (#faff00) for high contrast on dark, opacity 0.82
**Step 6 — Tags:** liquid, premium, grain, vintage, luxury, portfolio
**Target complexity:** 28-36

---

## Recipe 3: Elegant Minimal

**Goal:** Clean, professional background for corporate site or text-heavy page.

**Step 1 — Set type:**
```json
"backgroundType": "ribbon"
```

**Step 2 — Configure ribbons:**
```json
"ribbonConfig": {
  "noise": 0,
  "speed": 0.35,
  "taper": -0.1,
  "spread": 0.5,
  "opacity": 0.55,
  "rotation": 40,
  "ribbonCount": 3,
  "colorCycleSpeed": 1.2,
  "enableHoverEffect": true,
  "backgroundColor": "#ffffff",
  "useGradientColors": true
}
```

**Step 3 — Set effects:**
```json
"effectsConfig": {
  "blur": 5,
  "texture": "none",
  "colorMap": "none",
  "vignetteIntensity": 0,
  "flutedGlass": { "enabled": false },
  "contrast": 100,
  "brightness": 100,
  "saturation": 100
}
```

**Step 4 — Colors:** White background, one accent color (e.g., #3b82f6 blue)
**Step 5 — Text:** Black (#000000) on white background, opacity 0.9
**Step 6 — Tags:** ribbon, elegant, minimal, corporate, white, clean
**Target complexity:** 12-20

---

## Recipe 4: Atmospheric Cinematic

**Goal:** Immersive hero section for creative agency or portfolio landing.

**Step 1 — Set type:**
```json
"backgroundType": "aurora"
```

**Step 2 — Configure aurora:**
```json
"auroraConfig": {
  "hueStart": 130,
  "hueEnd": 200,
  "maxTTL": 50,
  "minTTL": 190,
  "maxWidth": 10,
  "minWidth": 95,
  "lineCount": 4,
  "maxHeight": 50,
  "minHeight": 900,
  "blurAmount": 18,
  "decaySpeed": 0.95,
  "backgroundColor": "#000000",
  "useGradientColors": true
}
```

**Step 3 — Set effects:**
```json
"effectsConfig": {
  "blur": 20,
  "texture": "grain",
  "colorMap": "none",
  "textureSize": 25,
  "textureOpacity": 40,
  "textureBlendMode": "overlay",
  "vignetteIntensity": 40,
  "flutedGlass": { "enabled": false },
  "contrast": 110,
  "brightness": 95,
  "saturation": 115
}
```

**Step 4 — Colors:** Purple-to-cyan gradient, high saturation
**Step 5 — Text:** White (#ffffff) with opacity 0.85 for glow effect
**Step 6 — Tags:** aurora, cinematic, dark, atmospheric, hero, immersive
**Target complexity:** 30-40

---

## Recipe 5: Dynamic Energy

**Goal:** High-energy background for gaming interface or startup landing page.

**Step 1 — Set type:**
```json
"backgroundType": "particleRing"
```

**Step 2 — Configure particles:**
Use default particleRingConfig with vivid neon colors.

**Step 3 — Set effects:**
```json
"effectsConfig": {
  "blur": 7,
  "texture": "diagonal",
  "colorMap": "cyberpunk",
  "textureSize": 35,
  "textureOpacity": 30,
  "textureBlendMode": "overlay",
  "vignetteIntensity": 20,
  "flutedGlass": { "enabled": false },
  "contrast": 110,
  "brightness": 100,
  "saturation": 120
}
```

**Step 4 — Colors:** Neon pink (#ec4899), cyan (#71ECFF), electric blue (#3b82f6)
**Step 5 — Text:** Cyan or white, high contrast
**Step 6 — Tags:** particleRing, dynamic, cyberpunk, neon, gaming, energy
**Target complexity:** 24-32

---

## Recipe 6: Subtle Texture

**Goal:** Calm, gentle background for wellness brand or lifestyle blog.

**Step 1 — Set type:**
```json
"backgroundType": "dandelion"
```

**Step 2 — Configure dandelion:**
Use default dandelionConfig with warm/light background (#e8f4fc).

**Step 3 — Set effects:**
```json
"effectsConfig": {
  "blur": 3,
  "texture": "dots",
  "colorMap": "none",
  "textureSize": 30,
  "textureOpacity": 25,
  "textureBlendMode": "overlay",
  "vignetteIntensity": 0,
  "flutedGlass": { "enabled": false },
  "contrast": 100,
  "brightness": 105,
  "saturation": 90
}
```

**Step 4 — Colors:** Warm neutrals, pastels, earth tones
**Step 5 — Text:** Dark gray (#374151) or black, high readability
**Step 6 — Tags:** dandelion, subtle, gentle, wellness, minimal, warm
**Target complexity:** 10-18

// Base image shared by every background type. Each renderer draws the image
// into its own base (2D drawImage, a three.js texture or a shader sampler), so
// fluted glass, the CSS filter wrapper and canvas capture all see it.

// Types whose gradient is the whole frame: the image goes underneath and the
// gradient is laid over it with an opacity and blend mode. Every other type
// has a separate base colour, which the image replaces. (Mesh/fluid paints a
// base colour too, but its blobs cover the whole frame.)
export const FULL_FIELD_TYPES = ['simple', 'liquid', 'fluid', 'prism']

export const isFullFieldType = (type) => FULL_FIELD_TYPES.includes(type)

export const BLEND_MODES = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft light' },
]

// Canvas 2D globalCompositeOperation for each blend mode
const COMPOSITE_OPS = {
  normal: 'source-over',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  'soft-light': 'soft-light',
}

export const blendModeToComposite = (mode) => COMPOSITE_OPS[mode] || 'source-over'

// Index used by the u_blendMode uniform in IMAGE_BLEND_GLSL
export const blendModeIndex = (mode) => {
  const i = BLEND_MODES.findIndex((m) => m.value === mode)
  return i < 0 ? 0 : i
}

// Draw `img` into the w×h area at (x, y), cover- or contain-fitted and centred
export const drawImageFit = (ctx, img, w, h, fit = 'cover', x = 0, y = 0) => {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (!iw || !ih || !w || !h) return
  const scale = fit === 'contain' ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih)
  const dw = iw * scale
  const dh = ih * scale
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
}

const MAX_FITTED_SIDE = 2048

// Canvas of the viewport's aspect (width × height in device pixels, capped)
// with the image fitted into it, so a WebGL texture stretched over the
// viewport maps 1:1. Contain leaves transparent bars, which the base colour
// shows through.
export const createFittedImageCanvas = (img, width, height, fit = 'cover', canvas) => {
  const aspect = width > 0 && height > 0 ? width / height : 1
  const longSide = Math.min(MAX_FITTED_SIDE, Math.max(width, height, 1))
  const w = Math.max(1, Math.round(aspect >= 1 ? longSide : longSide * aspect))
  const h = Math.max(1, Math.round(aspect >= 1 ? longSide / aspect : longSide))
  const c = canvas || document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, w, h)
  drawImageFit(ctx, img, w, h, fit)
  return c
}

// Shader helpers. Expects `vec2 uv` in 0..1 with y up (gl convention) and the
// fitted canvas uploaded with flipY (three.js's default for textures). The
// texture is sampled raw, like the shaders' own hex colours, so the image
// goes through the same output pipeline as the gradient. Shaders that work
// in linear light (the studio types) #define BASE_IMAGE_LINEAR first.
//   applyImageBase(base, uv)  - base types: image over the base colour
//   applyImageUnder(grad, uv) - full-field types: gradient over the image
export const IMAGE_BLEND_GLSL = /* glsl */ `
uniform sampler2D u_image;
uniform float u_hasImage;
uniform float u_imageOpacity;
uniform float u_gradientOpacity;
uniform float u_blendMode;

vec4 sampleBaseImage(vec2 uv) {
  vec4 c = texture2D(u_image, uv);
#ifdef BASE_IMAGE_LINEAR
  c.rgb = mix(c.rgb / 12.92, pow((c.rgb + 0.055) / 1.055, vec3(2.4)), step(0.04045, c.rgb));
#endif
  return c;
}

vec3 blendOverlayCh(vec3 b, vec3 s) {
  return mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(0.5, b));
}

vec3 blendSoftLightCh(vec3 b, vec3 s) {
  vec3 d = mix(sqrt(b), ((16.0 * b - 12.0) * b + 4.0) * b, step(b, vec3(0.25)));
  return mix(b - (1.0 - 2.0 * s) * b * (1.0 - b), b + (2.0 * s - 1.0) * (d - b), step(0.5, s));
}

// b = backdrop (image), s = source (gradient)
vec3 blendImage(vec3 b, vec3 s) {
  if (u_blendMode < 0.5) return s;
  if (u_blendMode < 1.5) return b * s;
  if (u_blendMode < 2.5) return b + s - b * s;
  if (u_blendMode < 3.5) return blendOverlayCh(b, s);
  return blendSoftLightCh(b, s);
}

vec3 applyImageBase(vec3 base, vec2 uv) {
  if (u_hasImage < 0.5) return base;
  vec4 img = sampleBaseImage(uv);
  return mix(base, img.rgb, img.a * u_imageOpacity);
}

vec3 applyImageUnder(vec3 grad, vec2 uv) {
  if (u_hasImage < 0.5) return grad;
  vec4 img = sampleBaseImage(uv);
  vec3 under = mix(grad, img.rgb, img.a);
  return mix(under, blendImage(under, grad), u_gradientOpacity);
}
`

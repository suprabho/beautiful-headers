// GLSL for the "studio" background types — Sky, Watercolor, Glow, Forms and
// Prism. All five share one uniform layout so a single raw-WebGL layer
// (StudioGradientLayer) can drive them: the palette is uploaded in OKLab, the
// ramp is blended in OKLab and converted to linear RGB, and every shader ends
// with the same grain + sRGB encode.

export const STUDIO_TYPES = ['sky', 'watercolor', 'glow', 'forms', 'prism']

export const GLOW_SHAPES = ['edge', 'circles', 'moons', 'pebbles', 'ellipses', 'halo', 'dunes', 'petals']
export const FORM_SHAPES = ['arch', 'circle', 'flower', 'star', 'ring', 'blob', 'heart', 'square', 'sparkle', 'clover', 'drop', 'burst']

export const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const COMMON = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_colors[8];
uniform float u_stops[8];
uniform int u_count;
uniform float u_scale;
uniform float u_grain;
uniform float u_seed;
uniform float u_amount;
uniform float u_soft;
uniform int u_shape;
uniform vec2 u_mouse;

vec3 oklabToLinear(vec3 c) {
  float l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  float l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  return vec3(
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

// Palette colour i (0-7) in linear RGB
vec3 pal(int idx) {
  vec3 c = u_colors[0];
  for (int i = 1; i < 8; i++) { if (i == idx) c = u_colors[i]; }
  return oklabToLinear(c);
}

// Blend through the palette at t using the (sorted) colour stops, in OKLab
vec3 rampLab(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c = u_colors[0];
  for (int i = 1; i < 8; i++) {
    if (i >= u_count) break;
    float a = u_stops[i - 1];
    float b = u_stops[i];
    float k = clamp((t - a) / max(b - a, 1e-4), 0.0, 1.0);
    c = mix(c, u_colors[i], k * k * (3.0 - 2.0 * k));
  }
  return c;
}
vec3 ramp(float t) { return oklabToLinear(rampLab(t)); }

// Ramp restricted to palette entries 1..n-1 (entry 0 is the backdrop)
vec3 rampTail(float t) {
  float lo = u_count > 1 ? u_stops[1] : 0.0;
  return ramp(mix(lo, 1.0, clamp(t, 0.0, 1.0)));
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float hash1(float n) { return fract(sin(n * 91.3458 + u_seed) * 47453.5453); }

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * snoise(p); p = r * p * 2.02; a *= 0.5; }
  return v;
}

float fbm3(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 3; i++) { v += a * snoise(p); p = r * p * 2.02; a *= 0.5; }
  return v;
}

vec4 finish(vec3 lin, vec2 frag) {
  vec3 c = toSrgb(lin);
  float g = hash(frag + fract(u_seed * 0.137) * 100.0) - 0.5;
  c += g * u_grain * 0.35;
  return vec4(c, 1.0);
}

// Centered, aspect-correct coordinates: y in [-0.5, 0.5]
vec2 centered() {
  return (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
}
`

// Sky: a vertical gradient under drifting, self-shadowed cumulus.
// colour 0 tints the clouds, the rest run top → horizon.
const SKY = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = centered() + u_mouse * 0.05;
  float t = u_time * 0.04;

  vec3 sky = ramp(mix(u_count > 1 ? u_stops[1] : 0.0, 1.0, 1.0 - uv.y));

  vec2 q = p * (1.1 / u_scale) + vec2(u_seed * 3.1, 0.0);
  vec2 drift = vec2(t * 1.5, 0.0);
  vec2 warp = vec2(fbm3(q * 0.5 + drift), fbm3(q * 0.5 + vec2(4.2, 1.7) - drift));
  // Billowy body from low octaves, a little fine detail on top
  float body = fbm3(q + warp * 0.45 + drift);
  float detail = fbm(q * 2.3 + warp + drift * 1.3) * 0.18;
  float n = body + detail;
  float nShade = fbm3(q + warp * 0.45 + drift + vec2(0.06, -0.1));

  // Clouds gather toward the top of the frame
  float bias = mix(-0.3, 0.2, uv.y);
  float cover = mix(0.3, -0.3, u_amount);
  float density = smoothstep(cover, cover + 0.3 + u_soft * 0.45, n + bias);
  float shade = smoothstep(-0.15, 0.3, nShade - body);

  vec3 cloudTint = mix(pal(0), vec3(1.0), 0.55);
  vec3 cloud = mix(cloudTint, cloudTint * mix(vec3(0.72, 0.78, 0.9), vec3(1.0), 0.4), shade * 0.6);
  vec3 col = mix(sky, cloud, density * 0.95);
  gl_FragColor = finish(col, gl_FragCoord.xy);
}
`

// Watercolor: domain-warped pigment pools with darker drying edges on paper.
const WATERCOLOR = `
void main() {
  vec2 p = centered() + u_mouse * 0.04;
  float t = u_time * 0.03;
  vec2 q = p * (0.9 / u_scale) + u_seed * 1.7;

  vec2 w1 = vec2(fbm3(q + vec2(0.0, t)), fbm3(q + vec2(5.2, 1.3 - t)));
  vec2 w2 = vec2(fbm3(q + 0.7 * w1 + vec2(1.7, 9.2) + t), fbm3(q + 0.7 * w1 + vec2(8.3, 2.8)));
  // Soft blooms with a ragged, granulating fringe
  float pigment = fbm3(q + 0.55 * w2) + fbm(q * 4.0 + w2 * 2.0) * 0.14;
  float hueField = fbm3(q * 0.6 + w1 * 0.8 - vec2(t, 0.0));

  // Paper shows through where the pigment is thin
  float thresh = mix(0.2, -0.4, u_amount);
  float wash = smoothstep(thresh - 0.02 - u_soft * 0.1, thresh + 0.2 + u_soft * 0.4, pigment);
  float edge = smoothstep(0.06, 0.0, abs(pigment - thresh - 0.03)) * 0.25;

  vec3 ink = ramp(clamp(0.5 + hueField * 0.9, 0.0, 1.0));
  float depth = smoothstep(0.0, 0.7, pigment - thresh);
  ink *= mix(1.0, 0.8, depth * 0.5 + edge);

  float fiber = fbm(gl_FragCoord.xy * 0.02) * 0.03;
  vec3 paper = vec3(0.985, 0.985, 0.975) - fiber;
  vec3 col = mix(paper, ink, clamp(wash + edge * wash, 0.0, 1.0));
  gl_FragColor = finish(col, gl_FragCoord.xy);
}
`

// Glow: luminous rims on dark shapes. colour 0 is the backdrop.
const GLOW = `
float sdCircle(vec2 p, vec2 c, float r) { return length(p - c) - r; }
float sdEllipse(vec2 p, vec2 c, vec2 r, float a) {
  p -= c;
  float s = sin(a), co = cos(a);
  p = mat2(co, -s, s, co) * p;
  float k = length(p / r);
  return (k - 1.0) * min(r.x, r.y);
}
float sdBox(vec2 p, vec2 c, vec2 b, float r) {
  vec2 d = abs(p - c) - b + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

vec3 acc;
float shapeIdx;
void light(float d) {
  float inner = u_soft * 0.2 + 0.05;
  float outer = 0.012 + u_soft * 0.03;
  float g = d < 0.0 ? exp(d / inner) : exp(-d / outer) * 0.9;
  int n = u_count - 1;
  float i = n > 0 ? mod(shapeIdx, float(n)) + 1.0 : 0.0;
  acc += pal(int(i)) * g * (0.7 + u_amount * 0.9);
  shapeIdx += 1.0;
}

void main() {
  vec2 p = centered() / u_scale + u_mouse * 0.04;
  float a = u_res.x / u_res.y;
  float t = u_time * 0.25;
  vec3 bg = pal(0);
  acc = vec3(0.0);
  shapeIdx = 0.0;

  if (u_shape == 0) {         // edge
    light(sdCircle(p, vec2(0.45 * a + 0.05 * sin(t), 0.75), 0.95));
    light(sdCircle(p, vec2(0.0, -1.55 + 0.03 * sin(t * 0.7)), 1.15));
  } else if (u_shape == 1) {  // circles
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      vec2 c = vec2((hash1(fi) - 0.5) * a * 0.9, (hash1(fi + 7.0) - 0.5) * 0.8);
      c += 0.03 * vec2(sin(t + fi), cos(t * 0.8 + fi));
      light(sdCircle(p, c, 0.08 + hash1(fi + 3.0) * 0.14));
    }
  } else if (u_shape == 2) {  // moons
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      vec2 c = vec2((fi - 1.0) * a * 0.3, (hash1(fi + 2.0) - 0.5) * 0.4 + 0.04 * sin(t + fi));
      float r = 0.12 + hash1(fi) * 0.1;
      float d = max(sdCircle(p, c, r), -sdCircle(p, c + vec2(r * 0.45, r * 0.25), r * 0.95));
      light(d);
    }
  } else if (u_shape == 3) {  // pebbles
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      vec2 c = vec2((hash1(fi + 1.0) - 0.5) * a * 0.85, (hash1(fi + 11.0) - 0.5) * 0.75);
      c += 0.02 * vec2(sin(t + fi * 2.0), cos(t + fi));
      vec2 b = vec2(0.06 + hash1(fi + 5.0) * 0.07, 0.05 + hash1(fi + 9.0) * 0.06);
      light(sdBox(p, c, b, min(b.x, b.y) * 0.9));
    }
  } else if (u_shape == 4) {  // ellipses
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      vec2 c = vec2((fi - 1.0) * 0.25 * a, 0.1 * sin(t + fi));
      light(sdEllipse(p, c, vec2(0.45, 0.18), 0.7 + fi * 0.5 + t * 0.1));
    }
  } else if (u_shape == 5) {  // halo
    light(abs(sdEllipse(p, vec2(0.0), vec2(0.42, 0.2), -0.35 + 0.05 * sin(t))) - 0.035);
    light(sdCircle(p, vec2(0.05 * sin(t), 0.02), 0.07));
  } else if (u_shape == 6) {  // dunes
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      vec2 c = vec2((fi - 1.5) * 0.55 * a * 0.6 + 0.05 * sin(t + fi), -0.95 - fi * 0.05 + 0.2 * hash1(fi));
      light(sdCircle(p, c, 0.75));
    }
  } else {                    // petals
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float x = (fi - 2.0) * 0.18;
      float h = 0.35 + 0.15 * (1.0 - abs(fi - 2.0) / 2.0);
      light(sdEllipse(p, vec2(x, -0.5 + h * 0.5 + 0.02 * sin(t + fi)), vec2(0.07, h), 0.0));
    }
  }

  vec3 col = bg + acc;
  col = col / (1.0 + max(col - 1.0, 0.0));
  gl_FragColor = finish(col, gl_FragCoord.xy);
}
`

// Forms: one soft silhouette filled with the palette, grainy edges.
// colour 0 is the backdrop, the rest flow from the rim inward.
const FORMS = `
#define PI 3.14159265
float polar(vec2 p, float r, float n, float amp, float sharp) {
  float a = atan(p.y, p.x);
  float w = cos(a * n);
  w = sign(w) * pow(abs(w), sharp);
  return length(p) - r * (1.0 + amp * w);
}
float sdHeart(vec2 p) {
  p.x = abs(p.x);
  p.y += 0.6;
  if (p.y + p.x > 1.0) return sqrt(dot(p - vec2(0.25, 0.75), p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
  vec2 a = p - vec2(0.0, 1.0);
  vec2 b = p - 0.5 * max(p.x + p.y, 0.0);
  return sqrt(min(dot(a, a), dot(b, b))) * sign(p.x - p.y);
}
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

float form(vec2 p, float t) {
  float s = sin(t) * 0.04;
  float c = cos(t * 0.13), si = sin(t * 0.13);
  vec2 r = mat2(c, -si, si, c) * p;
  if (u_shape == 0) {       // arch
    vec2 q = p - vec2(0.0, -0.62);
    return max(abs(length(q) - 0.52 - s) - 0.24, -q.y);
  }
  if (u_shape == 1) return length(p) - 0.36 - s;
  if (u_shape == 2) return polar(r, 0.3 + s, 6.0, 0.22, 1.0);
  if (u_shape == 3) return polar(r, 0.28 + s, 5.0, 0.35, 0.6) ;
  if (u_shape == 4) return abs(length(p) - 0.3 - s) - 0.1;
  if (u_shape == 5) return length(p) - 0.33 - 0.07 * snoise(normalize(p + 1e-4) * 1.3 + t * 0.2) - s;
  if (u_shape == 6) return sdHeart(p * 2.1 / (1.0 + s)) / 2.1;
  if (u_shape == 7) return sdRoundBox(r, vec2(0.3 + s), 0.08);
  if (u_shape == 8) return polar(r, 0.2 + s, 4.0, 0.9, 6.0);
  if (u_shape == 9) return polar(r, 0.3 + s, 4.0, 0.28, 0.35);
  if (u_shape == 10) {     // drop
    vec2 q = p + vec2(0.0, 0.08);
    float k = length(q) - 0.26 - s;
    return min(k, max(abs(q.x) - (0.26 - (q.y) * 0.45), -q.y) * 0.9) ;
  }
  return polar(r, 0.26 + s, 12.0, 0.18, 0.8);  // burst
}

void main() {
  vec2 p = centered() / u_scale + u_mouse * 0.04;
  float t = u_time * 0.3;
  vec3 bg = pal(0);
  float d = form(p, t);

  float feather = 0.006 + u_soft * 0.07;
  float n = snoise(p * 3.0 + t * 0.2) * 0.02 * u_soft;
  float inside = smoothstep(feather, -feather, d + n);
  float depth = clamp(-d / (0.18 + u_amount * 0.5), 0.0, 1.0);
  vec3 fill = rampTail(depth);

  // Soft outer bloom in the rim colour
  float bloom = exp(-max(d, 0.0) / (0.04 + u_soft * 0.1)) * 0.35;
  vec3 col = mix(bg, rampTail(0.0), bloom * (1.0 - inside));
  col = mix(col, fill, inside);
  gl_FragColor = finish(col, gl_FragCoord.xy);
}
`

// Prism: columns of light rising from the bottom, tallest in the centre.
// colour 0 is the dark top, the last colour the brightest base.
const PRISM = `
float barHeight(float i, float n, float t) {
  float x = (i + 0.5) / n;
  float bell = exp(-pow((x - 0.5 - u_mouse.x * 0.1) * 2.6, 2.0));
  float jitter = hash1(i) * 0.35 + 0.65;
  float wave = 0.04 * sin(t + i * 0.9);
  return clamp(bell * jitter * (0.55 + u_amount * 0.5) + wave + 0.15, 0.0, 1.2);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time * 0.6;
  float n = floor(mix(6.0, 36.0, clamp(1.0 / u_scale - 0.5, 0.0, 1.0)));
  float fx = uv.x * n;
  float i = floor(fx);
  float f = fract(fx);

  float h0 = barHeight(i, n, t);
  float hL = barHeight(i - 1.0, n, t);
  float hR = barHeight(i + 1.0, n, t);
  float soft = 0.02 + u_soft * 0.45;
  float h = h0;
  h = mix(h, hL, smoothstep(soft * 0.5, 0.0, f) * 0.5);
  h = mix(h, hR, smoothstep(1.0 - soft * 0.5, 1.0, f) * 0.5);

  float fade = 0.35 + u_soft * 0.3;
  float v = smoothstep(h, h - fade, uv.y);
  float haze = exp(-pow((uv.x - 0.5) * 2.2, 2.0)) * (1.0 - uv.y) * 0.35;
  float shade = 1.0 - 0.06 * smoothstep(0.0, 1.0, f);
  vec3 col = ramp(clamp(max(v, haze), 0.0, 1.0)) * shade;
  gl_FragColor = finish(col, gl_FragCoord.xy);
}
`

export const FRAGMENT_SHADERS = {
  sky: COMMON + SKY,
  watercolor: COMMON + WATERCOLOR,
  glow: COMMON + GLOW,
  forms: COMMON + FORMS,
  prism: COMMON + PRISM,
}

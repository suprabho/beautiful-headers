/**
 * Builds a self-contained analytics dashboard (scene-dashboard.html) from
 * scenes_export_full.json. Re-run after `node export-scenes.mjs` to refresh.
 *
 * Requires Node 20+ (only for the export step; this script runs on any Node).
 *   node scripts/build-scene-dashboard.mjs
 */
import { readFileSync, writeFileSync } from 'fs'

const AS_OF = '2026-06-09T00:00:00Z' // analysis reference date
const SITE = 'https://aura.promad.design'
const DOCUMENTED_TEXTURES = ['none', 'grain', 'scanlines', 'diagonal', 'dots', 'grid']
const DOCUMENTED_TYPES = ['liquid', 'fluid', 'ribbon', 'aurora', 'waves', 'dandelion', 'simple', 'particleRing']

const NOW = new Date(AS_OF).getTime()
const DAY = 86400000

const raw = JSON.parse(readFileSync('scenes_export_full.json', 'utf8'))
const scenes = Array.isArray(raw) ? raw : raw.scenes || raw.data || Object.values(raw)[0]

const parseData = (s) => {
  const d = s.scene_data
  if (typeof d === 'string') { try { return JSON.parse(d) } catch { return {} } }
  return d || {}
}
const inc = (o, k) => { o[k] = (o[k] || 0) + 1 }
const firstThumb = (t) => {
  if (!t) return null
  if (typeof t === 'string') return t
  return t.small || t.medium || t.large || t.full || Object.values(t).find(v => typeof v === 'string') || null
}

const byType = {}, texture = {}, colorMap = {}, byMonth = {}
const titles = {}
let flutedOn = 0, vignetteOn = 0
const blurVals = [], cxVals = [], ages = []

const enriched = scenes.map((s) => {
  const d = parseData(s)
  const bt = d.backgroundType || 'unknown'
  const e = d.effectsConfig || {}
  const tex = e.texture || 'none'
  const cm = e.colorMap || 'none'
  const blur = Number(e.blur) || 0
  const fluted = !!(e.flutedGlass && e.flutedGlass.enabled)
  const segments = (e.flutedGlass && e.flutedGlass.segments) || 0
  const vig = Number(e.vignetteIntensity) || 0

  inc(byType, bt); inc(texture, tex); inc(colorMap, cm)
  if (fluted) flutedOn++
  if (vig > 0) vignetteOn++
  blurVals.push(blur)

  const effectCount = [tex !== 'none', cm !== 'none', vig > 0, fluted, blur > 0].filter(Boolean).length
  let cx = 6 + effectCount * 2 + blur / 3 + (tex !== 'none' ? 1.5 : 0) + (cm !== 'none' ? 1 : 0) + (vig > 0 ? 1 : 0) + (fluted ? 2 : 0)
  cx = Math.min(52, Math.round(cx))
  cxVals.push(cx)

  const created = s.created_at ? new Date(s.created_at).getTime() : null
  const ageDays = created != null && !isNaN(created) ? Math.round((NOW - created) / DAY) : null
  if (ageDays != null) ages.push(ageDays)
  if (created && !isNaN(created)) inc(byMonth, new Date(created).toISOString().slice(0, 7))

  const title = (s.title || '').trim()
  inc(titles, title.toLowerCase())
  const short = (s.short_description || '').trim()
  const long = (s.long_description || '').trim()

  // Resolve thumbnail. A few legacy scenes store a raw base64 data: URL
  // (megabytes) instead of a CDN URL — keep those out of the embedded payload
  // and flag them rather than bloating the dashboard 15×.
  let thumb = firstThumb(s.thumbnail)
  const legacyThumb = typeof thumb === 'string' && (thumb.startsWith('data:') || thumb.length > 500)
  if (legacyThumb) thumb = null

  const issues = []
  if (!title || title.toLowerCase() === 'untitled scene') issues.push('untitled')
  if (!short || !long) issues.push('missing-desc')
  if (!DOCUMENTED_TEXTURES.includes(tex)) issues.push('undoc-texture')
  if (legacyThumb) issues.push('inline-thumb')

  const colors = (d.gradientConfig?.colors || d.fluidConfig?.colors || d.wavesConfig?.colors || d[bt + 'Config']?.colors || []).filter(c => typeof c === 'string').slice(0, 6)

  return {
    id: s.id, title: title || '(untitled)', slug: s.slug || '', type: bt,
    blur, texture: tex, colorMap: cm, fluted, vignette: vig, segments, complexity: cx,
    created_at: s.created_at || null, ageDays, thumb, colors, issues,
    old: ageDays != null && ageDays >= 120,
  }
})

const sortDesc = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])
ages.sort((a, b) => a - b)
const avg = (a) => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : 0
const cxBuckets = { 'Minimal (6–15)': 0, 'Moderate (16–25)': 0, 'Rich (26–35)': 0, 'Immersive (36–52)': 0 }
cxVals.forEach(c => { if (c <= 15) cxBuckets['Minimal (6–15)']++; else if (c <= 25) cxBuckets['Moderate (16–25)']++; else if (c <= 35) cxBuckets['Rich (26–35)']++; else cxBuckets['Immersive (36–52)']++ })

const attentionCounts = {
  untitled: enriched.filter(s => s.issues.includes('untitled')).length,
  missingDesc: enriched.filter(s => s.issues.includes('missing-desc')).length,
  undocTexture: enriched.filter(s => s.issues.includes('undoc-texture')).length,
  inlineThumb: enriched.filter(s => s.issues.includes('inline-thumb')).length,
  old: enriched.filter(s => s.old).length,
}
const flaggedTotal = enriched.filter(s => s.issues.length > 0).length

const summary = {
  total: scenes.length,
  asOf: AS_OF.slice(0, 10),
  site: SITE,
  byType: sortDesc(byType),
  texture: sortDesc(texture),
  colorMap: sortDesc(colorMap),
  cxBuckets,
  flutedPct: +(flutedOn / scenes.length * 100).toFixed(1),
  vignettePct: +(vignetteOn / scenes.length * 100).toFixed(1),
  blurAvg: avg(blurVals),
  cxAvg: avg(cxVals),
  byMonth: Object.entries(byMonth).sort(),
  ages: { oldest: ages[ages.length - 1], newest: ages[0], median: ages[Math.floor(ages.length / 2)] },
  documentedTypes: DOCUMENTED_TYPES,
  documentedTextures: DOCUMENTED_TEXTURES,
  attentionCounts,
  flaggedTotal,
  dupTitles: Object.entries(titles).filter(([k, v]) => v > 1 && k).sort((a, b) => b[1] - a[1]),
}

const DATA_JSON = JSON.stringify({ summary, scenes: enriched })

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Aura Scene Dashboard</title>
<style>
:root{
  --bg:#0a0b0f; --panel:#13151c; --panel2:#191c25; --line:#262a36;
  --txt:#e7eaf0; --muted:#8a90a2; --accent:#71ECFF; --accent2:#a855f7;
  --warn:#f5a524; --bad:#f5576c; --good:#39F58A;
}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(1200px 600px at 70% -10%,#16203a 0%,transparent 60%),var(--bg);color:var(--txt);font:14px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial}
a{color:inherit;text-decoration:none}
.wrap{max-width:1280px;margin:0 auto;padding:32px 24px 80px}
.head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.title{font-size:26px;font-weight:800;letter-spacing:-.02em;margin:0}
.title small{display:block;font-size:13px;font-weight:500;color:var(--muted);letter-spacing:0;margin-top:4px}
.badge{font-size:12px;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:5px 12px;background:var(--panel)}
.kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:28px}
.kpi{background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:14px;padding:16px}
.kpi .v{font-size:26px;font-weight:800;letter-spacing:-.02em}
.kpi .l{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-top:4px}
.kpi.accent .v{color:var(--accent)}
.kpi.warn .v{color:var(--warn)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px 20px}
.card h2{margin:0 0 14px;font-size:14px;font-weight:700;display:flex;align-items:center;gap:8px}
.card h2 .sub{font-weight:500;color:var(--muted);font-size:12px}
.bar-row{display:flex;align-items:center;gap:10px;margin:7px 0;font-size:13px}
.bar-row .name{width:120px;flex:none;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:capitalize}
.bar-track{flex:1;height:18px;background:var(--panel2);border-radius:6px;overflow:hidden}
.bar-fill{height:100%;border-radius:6px;background:var(--accent);min-width:2px}
.bar-row .val{width:78px;flex:none;text-align:right;color:var(--muted);font-variant-numeric:tabular-nums}
.timeline{display:flex;align-items:flex-end;gap:10px;height:150px;padding-top:10px}
.tl-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end}
.tl-bar{width:100%;max-width:54px;background:linear-gradient(180deg,var(--accent),#2a7bd6);border-radius:6px 6px 0 0;min-height:3px}
.tl-col .c{font-size:12px;font-weight:700}
.tl-col .m{font-size:11px;color:var(--muted)}
.note{font-size:12.5px;color:var(--muted);margin-top:12px;line-height:1.5}
.attn{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
.attn .kpi{cursor:pointer;transition:border-color .15s}
.attn .kpi:hover{border-color:var(--accent)}
.attn .kpi .v{color:var(--warn)}
.controls{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0 16px}
.controls input,.controls select{background:var(--panel2);border:1px solid var(--line);color:var(--txt);border-radius:9px;padding:9px 12px;font:inherit;outline:none}
.controls input:focus,.controls select:focus{border-color:var(--accent)}
.controls input[type=search]{min-width:230px}
.chk{display:flex;align-items:center;gap:7px;color:var(--muted);font-size:13px;cursor:pointer;user-select:none}
.count{margin-left:auto;color:var(--muted);font-size:13px}
.scene-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.scene{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;transition:transform .12s,border-color .12s}
.scene:hover{transform:translateY(-3px);border-color:var(--accent)}
.thumb{aspect-ratio:16/10;background:var(--panel2);position:relative;overflow:hidden}
.thumb img{width:100%;height:100%;object-fit:cover;display:block}
.thumb .cx{position:absolute;top:8px;right:8px;background:rgba(10,11,15,.78);backdrop-filter:blur(4px);border:1px solid var(--line);border-radius:7px;padding:2px 8px;font-size:11px;font-weight:700}
.thumb .age{position:absolute;top:8px;left:8px;background:rgba(10,11,15,.78);border-radius:7px;padding:2px 8px;font-size:11px;color:var(--muted)}
.sbody{padding:11px 12px 12px}
.stitle{font-size:13px;font-weight:600;line-height:1.35;margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:36px}
.meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.tag{font-size:11px;padding:2px 8px;border-radius:6px;background:var(--panel2);border:1px solid var(--line);text-transform:capitalize}
.dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.swatches{display:flex;gap:3px;margin-top:9px}
.swatches i{width:14px;height:14px;border-radius:4px;border:1px solid rgba(255,255,255,.12);display:block}
.issue{font-size:10.5px;padding:2px 7px;border-radius:6px;font-weight:600}
.issue.untitled{background:rgba(245,87,108,.16);color:#ff8aa0}
.issue.missing-desc{background:rgba(245,165,36,.16);color:#ffce7a}
.issue.undoc-texture{background:rgba(168,85,247,.18);color:#d2a8ff}
.issue.inline-thumb{background:rgba(113,236,255,.16);color:#9fe9f5}
.issue.old{background:rgba(138,144,162,.18);color:#b6bccf}
.empty{padding:40px;text-align:center;color:var(--muted)}
.legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:12px;font-size:12px;color:var(--muted)}
.legend span{display:flex;align-items:center;gap:6px}
@media(max-width:1080px){.kpis{grid-template-columns:repeat(3,1fr)}.grid{grid-template-columns:1fr}.attn{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.kpis{grid-template-columns:repeat(2,1fr)}}
</style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <h1 class="title">Aura Scene Catalog <small id="subhead"></small></h1>
    <span class="badge" id="asof"></span>
  </div>
  <div class="kpis" id="kpis"></div>

  <div class="grid">
    <div class="card"><h2>Background types <span class="sub" id="type-sub"></span></h2><div id="chart-type"></div></div>
    <div class="card"><h2>Complexity distribution <span class="sub" id="cx-sub"></span></h2><div id="chart-cx"></div>
      <div class="note" id="cx-note"></div></div>
  </div>
  <div class="grid">
    <div class="card"><h2>Texture <span class="sub">overlay channel</span></h2><div id="chart-tex"></div></div>
    <div class="card"><h2>Color map <span class="sub">most scenes ship neutral</span></h2><div id="chart-cm"></div></div>
  </div>

  <div class="card" style="margin-bottom:16px"><h2>Production over time <span class="sub">scenes created per month</span></h2>
    <div class="timeline" id="timeline"></div>
    <div class="note" id="growth-note"></div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <h2>Needs attention <span class="sub">click a tile to filter the catalog below</span></h2>
    <div class="attn" id="attn"></div>
    <div class="note" id="attn-note"></div>
  </div>

  <div class="card">
    <h2>Scene explorer <span class="sub">all scenes, live thumbnails</span></h2>
    <div class="controls">
      <input type="search" id="q" placeholder="Search title…" />
      <select id="f-type"></select>
      <select id="f-age">
        <option value="">Any age</option>
        <option value="old">Old (≥120d)</option>
        <option value="recent">Recent (≤30d)</option>
      </select>
      <select id="sort">
        <option value="age-desc">Oldest first</option>
        <option value="age-asc">Newest first</option>
        <option value="cx-desc">Most complex</option>
        <option value="cx-asc">Least complex</option>
        <option value="title">Title A–Z</option>
      </select>
      <label class="chk"><input type="checkbox" id="f-issues" /> Only flagged</label>
      <span class="count" id="count"></span>
    </div>
    <div class="scene-grid" id="grid"></div>
    <div class="empty" id="empty" style="display:none">No scenes match these filters.</div>
  </div>
</div>

<script>window.__DATA__=__SCENE_PAYLOAD__;</script>
<script>
(function(){
  var D=window.__DATA__, S=D.summary, SC=D.scenes;
  var TYPE_COLORS={liquid:'#a855f7',fluid:'#1C89FF',ribbon:'#d6dae6',aurora:'#71ECFF',waves:'#06b6d4',dandelion:'#F0CBA8',simple:'#94a3b8',particleRing:'#ec4899',unknown:'#64748b'};
  var $=function(id){return document.getElementById(id)};
  var el=function(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};
  var pct=function(n){return (n/S.total*100).toFixed(1)+'%'};

  // header
  $('subhead').textContent='— '+S.total+' scenes across '+S.byType.length+' background types';
  $('asof').textContent='Live export · as of '+S.asOf;

  // KPIs
  var kpis=[
    {v:S.total,l:'Total scenes',c:'accent'},
    {v:S.byType.length,l:'Background types'},
    {v:S.cxAvg,l:'Avg complexity'},
    {v:S.flutedPct+'%',l:'Fluted glass'},
    {v:S.ages.oldest+'d / '+S.ages.newest+'d',l:'Oldest / newest'},
    {v:S.flaggedTotal,l:'Flagged scenes',c:'warn'},
  ];
  kpis.forEach(function(k){var c=el('div','kpi'+(k.c?' '+k.c:''));c.appendChild(el('div','v',String(k.v)));c.appendChild(el('div','l',k.l));$('kpis').appendChild(c)});

  // bar chart helper
  function bars(container,entries,colorFn){
    var max=Math.max.apply(null,entries.map(function(e){return e[1]}));
    entries.forEach(function(e){
      var row=el('div','bar-row');
      row.appendChild(el('div','name',e[0]));
      var track=el('div','bar-track');
      var fill=el('div','bar-fill');
      fill.style.width=(e[1]/max*100)+'%';
      if(colorFn)fill.style.background=colorFn(e[0]);
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('div','val',e[1]+'  ·  '+pct(e[1])));
      container.appendChild(row);
    });
  }
  bars($('chart-type'),S.byType,function(n){return TYPE_COLORS[n]||'#71ECFF'});
  $('type-sub').textContent=S.byType[0][0]+' leads';
  bars($('chart-tex'),S.texture,function(n){return S.documentedTextures.indexOf(n)<0?'#a855f7':'#71ECFF'});
  bars($('chart-cm'),S.colorMap);

  // complexity buckets
  var cxEntries=Object.keys(S.cxBuckets).map(function(k){return [k,S.cxBuckets[k]]});
  bars($('chart-cx'),cxEntries,function(){return '#39F58A'});
  $('cx-sub').textContent='avg '+S.cxAvg+', peak 26';
  $('cx-note').textContent='The catalog skews light: '+pct(S.cxBuckets['Minimal (6–15)']+S.cxBuckets['Moderate (16–25)'])+' of scenes are Minimal or Moderate. Nothing reaches the Immersive tier (36+) — headroom for premium cinematic scenes.';

  // timeline
  var tlMax=Math.max.apply(null,S.byMonth.map(function(m){return m[1]}));
  S.byMonth.forEach(function(m){
    var col=el('div','tl-col');
    col.appendChild(el('div','c',String(m[1])));
    var bar=el('div','tl-bar');
    bar.style.height=(m[1]/tlMax*100)+'%';
    col.appendChild(bar);
    col.appendChild(el('div','m',m[0].slice(2)));
    $('timeline').appendChild(col);
  });
  var firstM=S.byMonth[0],lastM=S.byMonth[S.byMonth.length-1];
  $('growth-note').textContent='Output peaked early ('+firstM[0]+'–'+S.byMonth[1][0]+') and has tapered since; '+lastM[1]+' new scene'+(lastM[1]===1?'':'s')+' in '+lastM[0]+'. Median scene age is '+S.ages.median+' days.';

  // attention tiles
  var attn=[
    {k:'untitled',v:S.attentionCounts.untitled,l:'Untitled scenes'},
    {k:'missing-desc',v:S.attentionCounts.missingDesc,l:'Missing descriptions'},
    {k:'undoc-texture',v:S.attentionCounts.undocTexture,l:'Undocumented texture'},
    {k:'old',v:S.attentionCounts.old,l:'Old (≥120 days)'},
  ];
  attn.forEach(function(a){
    var c=el('div','kpi');c.appendChild(el('div','v',String(a.v)));c.appendChild(el('div','l',a.l));
    c.onclick=function(){
      if(a.k==='old'){$('f-age').value='old';$('f-issues').checked=false;}
      else {$('f-issues').checked=true;$('f-age').value='';window.__issueFilter=a.k;}
      $('q').value='';$('f-type').value='';
      render();$('grid').scrollIntoView({behavior:'smooth',block:'start'});
    };
    $('attn').appendChild(c);
  });
  var undoc=S.texture.filter(function(t){return S.documentedTextures.indexOf(t[0])<0});
  var noteBits=[];
  noteBits.push('Undocumented texture values in use: '+(undoc.map(function(t){return t[0]+' ('+t[1]+')'}).join(', ')||'none')+' — not in the scene-system spec (grain / scanlines / diagonal / dots / grid), likely schema drift worth reconciling.');
  if(S.attentionCounts.inlineThumb)noteBits.push(S.attentionCounts.inlineThumb+' scene still stores an inline base64 thumbnail instead of a CDN URL (kept out of this file to avoid bloat).');
  if(S.dupTitles.length)noteBits.push('Duplicate titles: '+S.dupTitles.slice(0,3).map(function(d){return '\\u201c'+d[0]+'\\u201d ×'+d[1]}).join(', ')+'.');
  $('attn-note').textContent=noteBits.join(' ');

  // explorer
  var typeSel=$('f-type');
  typeSel.appendChild(new Option('All types',''));
  S.byType.forEach(function(t){typeSel.appendChild(new Option(t[0]+' ('+t[1]+')',t[0]))});

  window.__issueFilter=null;
  function render(){
    var q=$('q').value.trim().toLowerCase();
    var ft=$('f-type').value, fa=$('f-age').value, onlyIssues=$('f-issues').checked, sort=$('sort').value;
    var inFilter=window.__issueFilter;
    var rows=SC.filter(function(s){
      if(q&&s.title.toLowerCase().indexOf(q)<0)return false;
      if(ft&&s.type!==ft)return false;
      if(fa==='old'&&!s.old)return false;
      if(fa==='recent'&&!(s.ageDays!=null&&s.ageDays<=30))return false;
      if(onlyIssues&&s.issues.length===0)return false;
      if(inFilter&&s.issues.indexOf(inFilter)<0)return false;
      return true;
    });
    rows.sort(function(a,b){
      if(sort==='age-desc')return (b.ageDays||0)-(a.ageDays||0);
      if(sort==='age-asc')return (a.ageDays||0)-(b.ageDays||0);
      if(sort==='cx-desc')return b.complexity-a.complexity;
      if(sort==='cx-asc')return a.complexity-b.complexity;
      if(sort==='title')return a.title.localeCompare(b.title);
      return 0;
    });
    var g=$('grid');g.innerHTML='';
    $('count').textContent=rows.length+' of '+S.total+' scenes';
    $('empty').style.display=rows.length?'none':'block';
    rows.slice(0,600).forEach(function(s){
      var card=el('a','scene');
      if(s.slug)card.href=S.site+'/scenes/'+s.slug,card.target='_blank',card.rel='noopener';
      var th=el('div','thumb');
      if(s.thumb){var img=el('img');img.loading='lazy';img.src=s.thumb;img.alt=s.title;th.appendChild(img);}
      var cx=el('div','cx','cx '+s.complexity);th.appendChild(cx);
      if(s.ageDays!=null)th.appendChild(el('div','age',s.ageDays+'d'));
      card.appendChild(th);
      var b=el('div','sbody');
      b.appendChild(el('p','stitle',s.title));
      var meta=el('div','meta');
      var tag=el('span','tag');var dot=el('span','dot');dot.style.background=TYPE_COLORS[s.type]||'#888';tag.appendChild(dot);tag.appendChild(document.createTextNode(' '+s.type));meta.appendChild(tag);
      if(s.texture!=='none')meta.appendChild(el('span','tag',s.texture));
      if(s.fluted)meta.appendChild(el('span','tag','fluted'));
      s.issues.forEach(function(i){meta.appendChild(el('span','issue '+i,i==='undoc-texture'?'texture?':i.replace('-',' ')))});
      if(s.old&&s.issues.length===0)meta.appendChild(el('span','issue old','old'));
      b.appendChild(meta);
      if(s.colors&&s.colors.length){var sw=el('div','swatches');s.colors.forEach(function(c){var i=el('i');i.style.background=c;sw.appendChild(i)});b.appendChild(sw)}
      card.appendChild(b);
      g.appendChild(card);
    });
  }
  ['input','change'].forEach(function(ev){
    $('q').addEventListener(ev,function(){window.__issueFilter=null;render()});
  });
  ['f-type','f-age','sort'].forEach(function(id){$(id).addEventListener('change',function(){window.__issueFilter=null;render()})});
  $('f-issues').addEventListener('change',function(){window.__issueFilter=null;render()});
  render();
})();
</script>
</body>
</html>`

writeFileSync('scene-dashboard.html', html.replace('__SCENE_PAYLOAD__', () => DATA_JSON))
const biggest = [...enriched].sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length)[0]
console.log('Payload: ' + (DATA_JSON.length / 1024).toFixed(0) + 'KB for ' + scenes.length + ' scenes (' + Math.round(DATA_JSON.length / scenes.length) + ' B/scene avg, biggest ' + JSON.stringify(biggest).length + ' B)')
console.log('Wrote scene-dashboard.html (' + (html.length / 1024).toFixed(0) + 'KB shell + embedded data)')
console.log('Attention:', JSON.stringify(summary.attentionCounts))
console.log('Undocumented textures:', summary.texture.filter(t => !DOCUMENTED_TEXTURES.includes(t[0])).map(t => t.join('=')).join(', ') || 'none')

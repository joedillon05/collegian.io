import os, json, sys, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen
from gen import P, side, front, crest, sticker, svg, wordmark, lockup_h, lockup_v, SIDE_BOX, FRONT_BOX, K

import tempfile
CANVAS = os.environ.get('COLLEGIAN_CANVAS_DIR', os.path.join(tempfile.gettempdir(), 'collegian-canvas', 'project'))  # design-canvas artboards (optional)
BRAND = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.makedirs(CANVAS, exist_ok=True); os.makedirs(BRAND, exist_ok=True)
DARK, LIGHT = '#15153A', '#FAF7F0'

def shade(hex_, t):
    n = int(hex_[1:], 16); r, g, b = n >> 16 & 255, n >> 8 & 255, n & 255
    m = 0 if t < 0 else 255; k = abs(t)
    f = lambda v: round(v + (m - v) * k)
    return '#%02x%02x%02x' % (f(r), f(g), f(b))

def palette(shell): return P(shell=shell, shell_sh=shade(shell, -0.2), shell_hi=shade(shell, 0.45))
HOLES = P(shell='{{shell}}', shell_sh='{{shellSh}}', shell_hi='{{shellHi}}')

def box(parts, vb, size, label):
    return f'<div style="width: {size}px; height: {size}px">' + svg(parts, vb=vb, label=label) + '</div>'

# ---------- tweakable single-mark artboards ----------
def mark_board(fname, title, caption, parts, vb="0 0 256 256"):
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>
body{{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}}
a{{color:#8FB3FF}}a:hover{{color:#FFC928}}
</style>
</helmet>
<div style="width: 720px; height: 720px; box-sizing: border-box; padding: 40px; background: {{{{bg}}}}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px">
<div style="width: 560px; height: 560px">{svg(parts, vb=vb, label=title)}</div>
<p style="margin: 0; font-size: 18px; font-weight: 600; letter-spacing: 0.02em; color: {{{{fg}}}}">{caption}</p>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"shell":{{"editor":"color","default":"#2F6BFF","options":["#2F6BFF","#C8102E","#F26B1D","#0F8A4C"],"section":"Colors"}},"theme":{{"editor":"enum","default":"dark","options":["dark","light"],"section":"Colors"}},"$preview":{{"width":720,"height":720}}}}'>
class Component extends DCLogic {{
  shade(hex, t) {{
    const n = parseInt(hex.slice(1), 16);
    const m = t < 0 ? 0 : 255, k = Math.abs(t);
    const f = v => Math.round(v + (m - v) * k).toString(16).padStart(2, '0');
    return '#' + f(n >> 16 & 255) + f(n >> 8 & 255) + f(n & 255);
  }}
  renderVals() {{
    const shell = this.props.shell ?? '#2F6BFF';
    const theme = this.props.theme ?? 'dark';
    return {{
      shell, shellSh: this.shade(shell, -0.2), shellHi: this.shade(shell, 0.45),
      bg: theme === 'light' ? '{LIGHT}' : '{DARK}',
      fg: theme === 'light' ? '#4A4E69' : '#C9D3E6'
    }};
  }}
}}
</script>
</body>
</html>
'''
    open(os.path.join(CANVAS, fname), 'w').write(html)

mark_board('Main.dc.html', 'Side view mark', 'Side view · primary mark', side(HOLES, uid='m'))
mark_board('Front.dc.html', 'Front view mark', 'Front view · symmetric, app-icon friendly', front(HOLES, uid='f'))
mark_board('Mascot.dc.html', 'Mascot mark', 'Mascot · someone is in there', side(HOLES, eyes=True, uid='e'))
mark_board('Crest.dc.html', 'Crest badge', 'Crest · collegiate shield badge', crest(HOLES))
mark_board('Sticker.dc.html', 'Sticker badge', 'Sticker · round badge with a white rim', sticker(HOLES))

# ---------- static lockups board ----------
def static_board(fname, title, w, h, body):
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>
body{{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}}
a{{color:#8FB3FF}}a:hover{{color:#FFC928}}
</style>
</helmet>
{body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''
    open(os.path.join(CANVAS, fname), 'w').write(html)

c = palette('#2F6BFF')
lh, LW, LH = lockup_h(side(c, uid='lh'), SIDE_BOX)
lh2, _, _ = lockup_h(side(c, uid='lh2'), SIDE_BOX, fill='#1B1B2F', outline=False)   # ink text for light backgrounds
lv, VW, VH = lockup_v(side(c, uid='lv'), SIDE_BOX)
lv2, _, _ = lockup_v(side(c, uid='lv2'), SIDE_BOX, fill='#1B1B2F', outline=False)
lf, FW, FH = lockup_h(front(c, uid='lf'), FRONT_BOX)
lf2, _, _ = lockup_h(front(c, uid='lf2'), FRONT_BOX, fill='#1B1B2F', outline=False)

def cell(bg, inner, label, fg):
    return (f'<div style="background: {bg}; border-radius: 16px; padding: 40px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px">'
            f'{inner}<p style="margin: 0; font-size: 15px; color: {fg}">{label}</p></div>')
def fit(parts, vb_w, vb_h, width):
    return f'<div style="width: {width}px; height: {width * vb_h / vb_w:.0f}px">' + svg(parts, vb=f"0 0 {vb_w:.0f} {vb_h:.0f}", label="collegian.io logo") + '</div>'

body = ('<div style="width: 1480px; height: 980px; box-sizing: border-box; padding: 32px; background: #0E0E26; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px">'
        + cell(DARK, fit(lh, LW, LH, 600), 'Horizontal · dark', '#C9D3E6')
        + cell(LIGHT, fit(lh2, LW, LH, 600), 'Horizontal · light (ink wordmark)', '#4A4E69')
        + cell(DARK, fit(lf, FW, FH, 600), 'Horizontal · front-view mark', '#C9D3E6')
        + cell(LIGHT, fit(lv2, VW, VH, 360), 'Stacked · light', '#4A4E69')
        + '</div>')
static_board('Lockups.dc.html', 'Lockups', 1480, 980, body)

# ---------- static sizes & colorways board ----------
sizes = [24, 32, 48, 64, 96, 128]
def ladder(bg, fg, uidp):
    items = ''.join(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 8px">'
                    f'<div style="width: {s}px; height: {s}px">{svg(side(c, uid=uidp+str(s)), vb="32 22 214 220", label="mark")}</div>'
                    f'<span style="font-size: 12px; color: {fg}">{s}</span></div>' for s in sizes)
    return f'<div style="background: {bg}; border-radius: 16px; padding: 28px 32px; display: flex; align-items: flex-end; gap: 28px">{items}</div>'

def tile(parts, vb, size, fill, radius):
    return (f'<div style="width: {size}px; height: {size}px; border-radius: {radius}px; background: {fill}; display: flex; align-items: center; justify-content: center">'
            f'<div style="width: {size*0.8:.0f}px; height: {size*0.8:.0f}px">{svg(parts, vb=vb, label="app icon")}</div></div>')
tiles = (f'<div style="background: {DARK}; border-radius: 16px; padding: 28px 32px; display: flex; align-items: flex-end; gap: 24px">'
         + tile(side(c, uid='t1'), "32 22 214 220", 128, '#2252CC', 28)
         + tile(front(palette('#FFFFFF') | {"shell": "#FFFFFF", "shell_sh": "#C9D3E6", "shell_hi": "#FFFFFF"}, uid='t2'), "28 22 202 216", 128, '#2F6BFF', 28)
         + tile(side(c, uid='t3'), "32 22 214 220", 64, '#2252CC', 14)
         + tile(side(c, uid='t4'), "32 22 214 220", 40, '#2252CC', 9)
         + '</div>')
ways = [('#2F6BFF', 'Royal'), ('#C8102E', 'Crimson'), ('#F26B1D', 'Orange'), ('#0F8A4C', 'Forest'), ('#7A3EDC', 'Violet')]
colorways = (f'<div style="background: {DARK}; border-radius: 16px; padding: 28px 32px; display: flex; align-items: flex-end; gap: 28px">'
             + ''.join(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 8px"><div style="width: 130px; height: 130px">{svg(side(palette(h), uid="w"+str(i)), vb="32 22 214 220", label=n)}</div><span style="font-size: 13px; color: #C9D3E6">{n} {h}</span></div>' for i, (h, n) in enumerate(ways))
             + '</div>')
body = ('<div style="width: 1480px; height: 620px; box-sizing: border-box; padding: 32px; background: #0E0E26; display: flex; flex-direction: column; gap: 24px">'
        '<div style="display: flex; gap: 24px; align-items: flex-start">' + ladder(DARK, '#C9D3E6', 'd') + ladder(LIGHT, '#4A4E69', 'l') + '</div>'
        + '<div style="display: flex; gap: 24px; align-items: flex-start">' + colorways + tiles + '</div></div>')
static_board('Scale.dc.html', 'Sizes and colorways', 1480, 620, body)

# ---------- canvas index ----------
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
index = {
  "v": 3, "createdOnFiles": {"v": 1, "at": now}, "title": "Collegian Logo Concepts",
  "launch": {"view": "canvas"}, "pages": [],
  "boards": {
    "Main.dc.html":    {"x": 0,    "y": 0, "w": 720, "h": 720, "title": "Side view (primary)"},
    "Front.dc.html":   {"x": 800,  "y": 0, "w": 720, "h": 720, "title": "Front view"},
    "Mascot.dc.html":  {"x": 1600, "y": 0, "w": 720, "h": 720, "title": "Mascot"},
    "Crest.dc.html":   {"x": 2400, "y": 0, "w": 720, "h": 720, "title": "Crest badge"},
    "Sticker.dc.html": {"x": 3200, "y": 0, "w": 720, "h": 720, "title": "Sticker badge"},
    "Lockups.dc.html": {"x": 0,    "y": 1040, "w": 1480, "h": 980, "title": "Lockups"},
    "Scale.dc.html":   {"x": 1560, "y": 1040, "w": 1480, "h": 620, "title": "Sizes and colorways"}
  },
  "order": ["Main.dc.html", "Front.dc.html", "Mascot.dc.html", "Crest.dc.html", "Sticker.dc.html", "Lockups.dc.html", "Scale.dc.html"],
  "notes": {
    "t1": {"x": 0, "y": -300, "text": "collegian.io — logo concepts (cartoon)", "kind": "title1", "maxW": 3920},
    "t2": {"x": 0, "y": 780, "text": "Lockups, sizes and colorways", "kind": "title1", "maxW": 3040}
  },
  "designSystems": []
}
json.dump(index, open(os.path.join(CANVAS, 'canvas.json'), 'w'), indent=1)

# ---------- brand files for the repo ----------
def crop(parts, bb, label, margin=6, square=False):
    x, y, w, h = bb
    if square:
        s = max(w, h) + 2 * margin
        return svg(parts, vb=f"{x + w/2 - s/2:.1f} {y + h/2 - s/2:.1f} {s:.1f} {s:.1f}", label=label)
    return svg(parts, vb=f"{x - margin:.1f} {y - margin:.1f} {w + 2*margin:.1f} {h + 2*margin:.1f}", label=label)

files = {
  'mark-side.svg':    crop(side(c, uid='a'), SIDE_BOX, 'collegian.io mark, side view'),
  'mark-front.svg':   crop(front(c, uid='b'), FRONT_BOX, 'collegian.io mark, front view'),
  'mark-mascot.svg':  crop(side(c, eyes=True, uid='c'), SIDE_BOX, 'collegian.io mascot mark'),
  'mark-crest.svg':   crop(crest(c), (30, 36, 196, 210), 'collegian.io crest badge'),
  'mark-sticker.svg': crop(sticker(c), (6, 6, 244, 244), 'collegian.io sticker badge', margin=2),
  'favicon.svg':      crop(side(c, uid='d'), SIDE_BOX, 'collegian.io', margin=2, square=True),
  'logo-horizontal.svg': svg(lh, vb=f"0 0 {LW:.0f} {LH:.0f}", label='collegian.io'),
  'logo-horizontal-ink.svg': svg(lh2, vb=f"0 0 {LW:.0f} {LH:.0f}", label='collegian.io'),
  'logo-stacked.svg': svg(lv, vb=f"0 0 {VW:.0f} {VH:.0f}", label='collegian.io'),
  'logo-stacked-ink.svg': svg(lv2, vb=f"0 0 {VW:.0f} {VH:.0f}", label='collegian.io'),
}
wp, tw, asc, dsc = wordmark()
files['wordmark.svg'] = svg([f'<g transform="translate(6 {asc + 6:.0f})">'] + wp + ['</g>'], vb=f"0 0 {tw + 12:.0f} {asc + dsc + 12:.0f}", label='collegian.io')
wp2, _, _, _ = wordmark(fill='#1B1B2F', outline=False)
files['wordmark-ink.svg'] = svg([f'<g transform="translate(6 {asc + 6:.0f})">'] + wp2 + ['</g>'], vb=f"0 0 {tw + 12:.0f} {asc + dsc + 12:.0f}", label='collegian.io')
for name, content in files.items():
    open(os.path.join(BRAND, name), 'w').write(content + '\n')
print('canvas files:', sorted(os.listdir(CANVAS)))
print('brand files:', sorted(files), {k: len(v) for k, v in files.items()})

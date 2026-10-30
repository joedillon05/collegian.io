# Cartoon vector logo generator for collegian.io (v2)
K = '#1B1B2F'

def P(shell='#2F6BFF', shell_hi='#8FB3FF', shell_sh='#2252CC',
      cap='#2A2A44', cap_top='#3C3C5C', gold='#FFC928', gold_sh='#E09A12',
      mask='#E8EBF2', opening='#1F1F3A', ink=K, sw=7):
    return dict(shell=shell, shell_hi=shell_hi, shell_sh=shell_sh, cap=cap, cap_top=cap_top,
                gold=gold, gold_sh=gold_sh, mask=mask, opening=opening, ink=ink, sw=sw)

def S(c): return f'stroke="{c["ink"]}" stroke-width="{c["sw"]}" stroke-linejoin="round" stroke-linecap="round"'

def mask_bars(c, bars):
    out = [f'<path d="{b}" fill="none" stroke="{c["ink"]}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>' for b in bars]
    out += [f'<path d="{b}" fill="none" stroke="{c["mask"]}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>' for b in bars]
    return out

def cap(c, cx, L, R, top, bot, cord_to, hang, knot, fringe, strands, skull):
    """Mortarboard: skull cap, board (thickness + top face), cord, button, knot, fringe."""
    s = S(c); mid = (top + bot) / 2
    parts = [f'<path d="{skull}" fill="{c["cap"]}" {s}/>',
             f'<path d="M{L} {mid} L{cx} {bot} L{R} {mid} L{R} {mid+11} L{cx} {bot+11} L{L} {mid+11} Z" fill="{c["cap"]}" {s}/>',
             f'<path d="M{L} {mid} L{cx} {top} L{R} {mid} L{cx} {bot} Z" fill="{c["cap_top"]}" {s}/>']
    cord = f'M{cx} {mid} L{cord_to} {mid} {hang}'
    parts += [f'<path d="{cord}" fill="none" stroke="{c["ink"]}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>',
              f'<path d="{cord}" fill="none" stroke="{c["gold"]}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
              f'<circle cx="{cx}" cy="{mid}" r="9" fill="{c["gold"]}" {s}/>',
              f'<path d="{fringe}" fill="{c["gold"]}" {s}/>',
              f'<path d="{strands}" fill="none" stroke="{c["gold_sh"]}" stroke-width="4" stroke-linecap="round"/>',
              f'<ellipse cx="{knot[0]}" cy="{knot[1]}" rx="12" ry="8" fill="{c["gold"]}" {s}/>']
    return parts

# ---------- SIDE VIEW (facing right, tassel hangs off the back) ----------
def side(c=None, eyes=False, uid='s'):
    c = c or P(); s = S(c)
    shell = ("M206 122 C212 90 188 60 130 58 C68 56 36 98 38 150 C39 186 54 214 86 224 "
             "C110 232 150 236 178 236 C196 236 208 228 208 212 L182 212 C174 212 170 208 170 200 "
             "L170 136 C170 128 174 122 182 122 Z")
    parts = [f'<rect x="166" y="118" width="44" height="94" rx="10" fill="{c["opening"]}"/>']
    if eyes:
        parts.append(f'<ellipse cx="188" cy="170" rx="13" ry="14" fill="#FFFFFF"/>'
                     f'<circle cx="192" cy="172" r="6.5" fill="{c["ink"]}"/>'
                     f'<circle cx="195" cy="168" r="2.5" fill="#FFFFFF"/>')
    parts.append(f'<path d="{shell}" fill="{c["shell"]}" {s}/>')
    parts.append(f'<path d="M70 204 C104 226 150 226 184 216" fill="none" stroke="{c["shell_sh"]}" stroke-width="12" stroke-linecap="round"/>')
    parts.append(f'<path d="M82 128 C88 110 102 100 120 98" fill="none" stroke="{c["shell_hi"]}" stroke-width="9" stroke-linecap="round"/>')
    parts.append(f'<circle cx="116" cy="172" r="8" fill="{c["shell_sh"]}" stroke="{c["ink"]}" stroke-width="6"/>')
    bars = (["M180 150 L240 150", "M180 190 L240 190"] if eyes else ["M180 154 L240 154", "M180 184 L240 184"])
    parts += mask_bars(c, ["M202 124 C226 124 240 128 240 146 L240 194 C240 210 226 212 202 212"] + bars)
    parts += cap(c, cx=128, L=56, R=200, top=28, bot=84, cord_to=58, hang="C50 74 64 90 58 108",
                 knot=(58, 110),
                 fringe="M46 116 L70 116 C76 132 80 148 76 162 C66 170 50 170 40 162 C36 148 40 132 46 116 Z",
                 strands="M52 128 L49 156 M64 128 L67 156",
                 skull="M74 84 C74 54 100 42 128 42 C156 42 182 54 182 84 C164 94 92 94 74 84 Z")
    return parts

# ---------- FRONT VIEW (symmetric, tassel hangs off the right) ----------
def front(c=None, uid='f'):
    c = c or P(); s = S(c)
    shell = ("M40 156 C40 86 84 56 128 56 C172 56 216 86 216 156 C216 200 206 232 182 232 "
             "L170 232 L170 150 C170 138 162 132 152 132 L104 132 C94 132 86 138 86 150 L86 232 "
             "L74 232 C50 232 40 200 40 156 Z")
    parts = [f'<path d="M86 150 C86 138 94 132 104 132 L152 132 C162 132 170 138 170 150 L170 232 L86 232 Z" fill="{c["opening"]}"/>',
             f'<path d="{shell}" fill="{c["shell"]}" {s}/>',
             f'<path d="M54 192 C56 206 62 216 72 220 M202 192 C200 206 194 216 184 220" fill="none" stroke="{c["shell_sh"]}" stroke-width="11" stroke-linecap="round"/>',
             f'<path d="M117 84 L139 84 L139 132 L117 132 Z" fill="#FFFFFF" {s}/>',
             f'<path d="M62 124 C66 106 80 94 98 90" fill="none" stroke="{c["shell_hi"]}" stroke-width="9" stroke-linecap="round"/>']
    parts += mask_bars(c, ["M58 162 L198 162", "M58 196 L198 196", "M106 146 L106 226", "M150 146 L150 226"])
    parts += cap(c, cx=128, L=52, R=204, top=28, bot=84, cord_to=198, hang="C206 74 192 90 198 108",
                 knot=(198, 110),
                 fringe="M186 116 L210 116 C216 132 220 148 216 162 C206 170 190 170 180 162 C176 148 180 132 186 116 Z",
                 strands="M192 128 L189 156 M204 128 L207 156",
                 skull="M72 84 C72 54 100 42 128 42 C156 42 184 54 184 84 C164 94 92 94 72 84 Z")
    return parts

# ---------- CREST: front view inside a shield ----------
def crest(c=None, field='#1C2454', band='#FFC928'):
    c = c or P(); s = S(c)
    shield = "M30 36 L226 36 L226 148 C226 200 182 234 128 246 C74 234 30 200 30 148 Z"
    inner  = "M44 50 L212 50 L212 146 C212 190 176 220 128 231 C80 220 44 190 44 146 Z"
    parts = [f'<path d="{shield}" fill="{field}" {s}/>',
             f'<path d="{inner}" fill="none" stroke="{band}" stroke-width="5" stroke-linejoin="round"/>',
             '<g transform="translate(128 142) scale(0.66) translate(-128 -132)">'] + front(c, uid='cr') + ['</g>']
    return parts

# ---------- STICKER: side view in a circle with a white sticker rim ----------
def sticker(c=None, disc='#FFF1BF'):
    c = c or P(); s = S(c)
    parts = [f'<circle cx="128" cy="128" r="122" fill="#FFFFFF" {s}/>',
             f'<circle cx="128" cy="128" r="108" fill="{disc}" stroke="{c["ink"]}" stroke-width="5"/>',
             '<g transform="translate(128 128) scale(0.72) translate(-141 -135)">'] + side(c, uid='st') + ['</g>']
    return parts

def wordmark(fill='#FFFFFF', io='#FFC928', ink=K, size=120, font='fonts/Lilita_One.ttf', outline=True):
    """Returns (parts, width, height, baseline) for 'collegian' + '.io' as outlined paths at the given px size."""
    import os, sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from text2path import load, text_path
    f = load(os.path.join(os.path.dirname(os.path.abspath(__file__)), font))
    d1, w1, upm, asc, desc = text_path(f, 'collegian')
    d2, w2, _, _, _ = text_path(f, '.io')
    sc = size / upm
    sw = round(10 / sc)  # ~10px outline in font units
    st = f' stroke="{ink}" stroke-width="{sw}" stroke-linejoin="round" paint-order="stroke"' if outline else ''
    parts = [f'<g transform="scale({sc})"><path d="{d1}" fill="{fill}"{st}/>'
             f'<path transform="translate({w1} 0)" d="{d2}" fill="{io}"{st}/></g>']
    return parts, (w1 + w2) * sc, asc * sc, -desc * sc

def lockup_h(mark_parts, mark_box, size=120, gap=28, pad=16, **wm):
    """Horizontal lockup: mark (its bbox in 256-space) scaled to the wordmark's cap-ish height, wordmark to the right."""
    parts, tw, asc, dsc = wordmark(size=size, **wm)
    mh = asc * 1.5
    bx, by, bw, bh = mark_box
    msc = mh / bh
    mw = bw * msc
    H = mh + 2 * pad
    W = pad + mw + gap + tw + pad
    base_y = pad + (mh - (asc * 0.72)) / 2 + asc * 0.72   # center the x-height band on the mark
    out = [f'<g transform="translate({pad} {pad}) scale({msc}) translate({-bx} {-by})">'] + mark_parts + ['</g>',
           f'<g transform="translate({pad + mw + gap} {base_y})">'] + parts + ['</g>']
    return out, W, H

def lockup_v(mark_parts, mark_box, size=96, gap=16, pad=16, **wm):
    parts, tw, asc, dsc = wordmark(size=size, **wm)
    bx, by, bw, bh = mark_box
    mh = 260; msc = mh / bh; mw = bw * msc
    W = max(mw, tw) + 2 * pad
    H = pad + mh + gap + asc + dsc + pad
    out = [f'<g transform="translate({(W - mw) / 2} {pad}) scale({msc}) translate({-bx} {-by})">'] + mark_parts + ['</g>',
           f'<g transform="translate({(W - tw) / 2} {pad + mh + gap + asc})">'] + parts + ['</g>']
    return out, W, H

SIDE_BOX = (37.9, 28, 202.1, 208)
FRONT_BOX = (40, 28, 177.6, 204)

def svg(parts, vb="0 0 256 256", label="collegian.io logo", attrs=''):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="{label}"{attrs}>'
            + ''.join(parts) + '</svg>')

if __name__ == '__main__':
    out = {'side': svg(side()), 'side_eyes': svg(side(eyes=True)), 'front': svg(front()),
           'crest': svg(crest()), 'sticker': svg(sticker())}
    p, W, H = lockup_h(side(uid='lh'), SIDE_BOX); out['lockup_h'] = svg(p, vb=f"0 0 {W:.0f} {H:.0f}")
    p, W, H = lockup_v(side(uid='lv'), SIDE_BOX); out['lockup_v'] = svg(p, vb=f"0 0 {W:.0f} {H:.0f}")
    p, W, H = lockup_h(front(uid='lf'), FRONT_BOX); out['lockup_hf'] = svg(p, vb=f"0 0 {W:.0f} {H:.0f}")
    for k, v in out.items(): open(f'{k}.svg', 'w').write(v)
    print('wrote', list(out))

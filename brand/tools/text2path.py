# Convert a string to a single SVG path using a TTF (no kerning). Returns (d, width, upm, ascender, descender) in font units.
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

def load(path, wght=None):
    f = TTFont(path)
    if 'fvar' in f and wght is not None:
        from fontTools.varLib import instancer
        f = instancer.instantiateVariableFont(f, {'wght': wght})
    return f

def text_path(font, text, letter_spacing=0):
    gs = font.getGlyphSet(); cmap = font.getBestCmap()
    upm = font['head'].unitsPerEm
    pen = SVGPathPen(gs)
    x = 0
    for ch in text:
        gname = cmap.get(ord(ch))
        if gname is None: continue
        g = gs[gname]
        g.draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))  # flip y so SVG y goes down
        x += g.width + letter_spacing
    hhea = font['hhea']
    return pen.getCommands(), x, upm, hhea.ascent, hhea.descent

if __name__ == '__main__':
    import sys, json
    font = load(sys.argv[1], float(sys.argv[3]) if len(sys.argv) > 3 else None)
    d, w, upm, asc, desc = text_path(font, sys.argv[2])
    print(json.dumps({'w': w, 'upm': upm, 'asc': asc, 'desc': desc, 'dlen': len(d)}))

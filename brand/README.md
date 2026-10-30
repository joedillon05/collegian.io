# collegian.io brand

Cartoon mark: a football helmet wearing a graduation mortarboard, tassel
swinging off one side. Chunky dark outlines, flat fills, one shine. The two
halves of the game (athletes, colleges) in one friendly object.

![preview](preview.png)

## Files

| File | Use |
|---|---|
| `mark-side.svg` | Primary mark. Side view, facing right, tassel off the back. |
| `mark-front.svg` | Symmetric front view. Best for square app icons and the crest. |
| `mark-mascot.svg` | Side view with an eye peeking through the cage. Playful alternate. |
| `mark-crest.svg` | Front mark inside a navy shield with a gold band. Collegiate badge. |
| `mark-sticker.svg` | Side mark in a cream disc with a white sticker rim. Social / stickers. |
| `favicon.svg` | Side mark cropped square. Use as the SVG favicon; rasterize for 16/32 px. |
| `wordmark.svg`, `wordmark-ink.svg` | "collegian" in white or ink, ".io" in gold. Lilita One, outlined to paths. |
| `logo-horizontal.svg`, `logo-horizontal-ink.svg` | Side mark + wordmark. White-text version for dark, ink version for light. |
| `logo-stacked.svg`, `logo-stacked-ink.svg` | Mark above wordmark, for splash screens and share images. |

All SVGs are self-contained (no fonts, no external references) and scale to
any size. The white-text wordmark carries a dark outline, so it also reads on
light photos and colored backgrounds.

## Palette

| Role | Hex |
|---|---|
| Ink / outlines | `#1B1B2F` |
| Shell (royal blue) | `#2F6BFF` |
| Shell shade / highlight | `#2252CC` / `#8FB3FF` |
| Mortarboard | `#2A2A44`, top face `#3C3C5C` |
| Gold (tassel, ".io") | `#FFC928`, shade `#E09A12` |
| Facemask | `#E8EBF2` |
| Dark background | `#15153A` |
| Light background | `#FAF7F0` |

Alternate shell colorways that keep contrast with the gold and ink:
crimson `#C8102E`, orange `#F26B1D`, forest `#0F8A4C`, violet `#7A3EDC`.

## Type

Wordmark: [Lilita One](https://fonts.google.com/specimen/Lilita+One)
(SIL Open Font License), lowercase, ".io" in gold. UI type can stay whatever
the app uses; the wordmark is pre-outlined so the font is not a runtime
dependency.

## Regenerating

The marks are drawn in `tools/gen.py` as parameterized SVG paths. `tools/build.py`
writes every file in this folder (plus the design-canvas artboards used while
exploring). It needs Python 3 with `fonttools` and the Lilita One TTF at
`tools/fonts/Lilita_One.ttf` (download from Google Fonts; it is not committed).

```bash
pip install fonttools
python3 brand/tools/build.py
```

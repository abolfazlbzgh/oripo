# Self-hosted type

Each document links only its script’s font stylesheet and selects that stack with its locale class on `<html>`. The five Latin locales share one Inter file and the existing system serif heading stack. Persian, Arabic, Hindi, Simplified Chinese and Japanese each use a single script-specific face for body text and headings. Each face has a variable 100–900 weight axis, a Unicode range and `font-display: swap`. CSS requests a face when the document uses it. Language names from other scripts can use the reader’s installed fallback fonts. [Font declarations](../public/fonts/)

## Sources and licenses

The following sources are pinned to Google Fonts commit `06bfe0d62a98375cb09c942fa18e68bd32cff057`. Each directory contains the original TTF, author metadata and SIL Open Font License 1.1. The WOFF2 derivatives retain the copyright and license name records. The six full license texts ship under `/fonts/`. Adobe reserves the name “Source” in the two CJK licenses. The subsets use their Noto names and project-local CSS aliases.

| Local WOFF2             | Upstream family and version                      |   Bytes | Source and distributed license                                                                                                                                     |
| ----------------------- | ------------------------------------------------ | ------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `inter-latin.woff2`     | Inter 4.001, Inter Project Authors               |  43,732 | [Source](https://github.com/google/fonts/tree/06bfe0d62a98375cb09c942fa18e68bd32cff057/ofl/inter) · [OFL](../public/fonts/OFL-inter.txt)                           |
| `vazirmatn-fa.woff2`    | Vazirmatn 33.003, Vazirmatn Project Authors      |  62,396 | [Source](https://github.com/google/fonts/tree/06bfe0d62a98375cb09c942fa18e68bd32cff057/ofl/vazirmatn) · [OFL](../public/fonts/OFL-vazirmatn.txt)                   |
| `noto-arabic.woff2`     | Noto Sans Arabic 2.012, Noto Project Authors     |  95,100 | [Source](https://github.com/google/fonts/tree/06bfe0d62a98375cb09c942fa18e68bd32cff057/ofl/notosansarabic) · [OFL](../public/fonts/OFL-notosansarabic.txt)         |
| `noto-devanagari.woff2` | Noto Sans Devanagari 2.007, Noto Project Authors | 115,600 | [Source](https://github.com/google/fonts/tree/06bfe0d62a98375cb09c942fa18e68bd32cff057/ofl/notosansdevanagari) · [OFL](../public/fonts/OFL-notosansdevanagari.txt) |
| `noto-sc.woff2`         | Noto Sans SC 2.004-H2, Adobe                     | 109,700 | [Source](https://github.com/google/fonts/tree/06bfe0d62a98375cb09c942fa18e68bd32cff057/ofl/notosanssc) · [OFL](../public/fonts/OFL-notosanssc.txt)                 |
| `noto-jp.woff2`         | Noto Sans JP 2.004-H2, Adobe                     |  93,300 | [Source](https://github.com/google/fonts/tree/06bfe0d62a98375cb09c942fa18e68bd32cff057/ofl/notosansjp) · [OFL](../public/fonts/OFL-notosansjp.txt)                 |

## Rebuild after changing the copy

The CJK subsets include each character used in that locale’s JSON, its native language name and common punctuation. Regenerate them when adding translations or lessons. Arabic, Persian and Devanagari include their core alphabet blocks and shaping features. Both CJK faces use horizontal layout. Width and optical-size axes are fixed at their source defaults. Glyph hinting is removed.

Use Python 3.12 with `fonttools==4.60.1` and `brotli==1.1.0` in an isolated environment. Copy the six source directories listed above from the pinned revision, then run this recipe from the project root. Its single argument is the directory containing those six folders.

```python
import json
from pathlib import Path
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

sources = Path(sys.argv[1])
target = Path("public/fonts")
target.mkdir(parents=True, exist_ok=True)
families = {
    "inter": ("inter-latin", None),
    "vazirmatn": ("vazirmatn-fa", None),
    "notosansarabic": ("noto-arabic", None),
    "notosansdevanagari": ("noto-devanagari", None),
    "notosanssc": ("noto-sc", "zh-Hans"),
    "notosansjp": ("noto-jp", "ja"),
}

def points(first, last):
    return set(range(first, last + 1))

common = (
    points(0x20, 0x7e) | points(0x2000, 0x206f)
    | {0xa0, 0xab, 0xb0, 0xb7, 0xbb, 0xd7, 0x2212}
)

def characters(family, locale):
    if family == "inter":
        return common | points(0xa0, 0xff) | {0x131, 0x152, 0x153, 0x178, 0x1e9e, 0x20ac}
    if family == "notosansdevanagari":
        return common | points(0x900, 0x97f)
    if locale is None:
        return common | points(0x600, 0x6ff) | points(0x750, 0x77f)
    text = {"ja": "日本語", "zh-Hans": "简体中文"}[locale] + "、。，「」（）！？・ー々…"
    for file in (Path("app/i18n") / locale).glob("*.json"):
        text += json.dumps(json.loads(file.read_text("utf-8")), ensure_ascii=False)
    return common | set(map(ord, text))

for family, (filename, locale) in families.items():
    source = sources / family
    original = next(p for p in source.glob("*.ttf") if "Italic" not in p.name)
    font = TTFont(original, recalcTimestamp=False)
    options = subset.Options()
    options.layout_features.extend(["lnum", "tnum"])
    if locale:
        vertical = {"valt", "vert", "vrt2", "vkrn", "vpal", "vhal", "vchw"}
        options.layout_features = [tag for tag in options.layout_features if tag not in vertical]
    options.hinting = False
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.name_legacy = True
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=characters(family, locale))
    worker.subset(font)
    pinned = {a.axisTag: a.defaultValue for a in font["fvar"].axes if a.axisTag != "wght"}
    if pinned:
        instantiateVariableFont(font, pinned, inplace=True)
    font.flavor = "woff2"
    font.save(target / (filename + ".woff2"))
    license_text = (source / "OFL.txt").read_text("utf-8")
    (target / ("OFL-" + family + ".txt")).write_bytes(
        ("\n".join(line.rstrip() for line in license_text.splitlines()) + "\n").encode("utf-8")
    )
```

Check the new text against both the output font’s Unicode cmap and the `unicode-range` descriptor in the stylesheet. A source character outside the declared range needs a corresponding CSS update.

For Phase 7, the recipe reproduced all six font binaries byte for byte. The distributed licenses preserve the full upstream wording with trailing spaces removed. The declared ranges and font cmaps covered the characters in all ten locale dictionaries. In a local font fixture, Chromium, Firefox and WebKit each requested one WOFF2 when rendering the translated Guide introduction alongside all ten native language names. Chromium’s font inspector confirmed the text of each introduction used the downloaded face.

#!/usr/bin/env python3
"""Render Google Play icon, feature graphics, and phone screenshots."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SRC_ICON = ROOT / "assets" / "android-icon-foreground.png"
OUT = Path(__file__).resolve().parent / "graphics"
SHOTS = Path(__file__).resolve().parent / "screenshots" / "phone"
PREVIEW = Path(__file__).resolve().parent / "preview" / "phone.html"

WINE = (155, 27, 48)
FOREST = (31, 122, 77)
CREAM = (255, 244, 232)
INK = (28, 27, 31)
MUTED = (73, 69, 79)

FEATURE = {
    "en-US": ("25,000", "3 d 5 h", "Working time from take-home income"),
    "ru-RU": ("25 000", "3 дн. 5 ч.", "Рабочее время по доходу на руки"),
    "zh-CN": ("25,000", "3 天 5 小时", "按实得收入换算工作时间"),
}

SCREEN_LOCALES = {"en": "en-US", "ru": "ru-RU", "zh-Hans": "zh-CN"}
SCENES = {
    "converter": "01-converter.png",
    "converter-large": "02-converter-large.png",
    "first-launch": "03-first-launch.png",
    "settings-person": "04-settings-person.png",
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc" if bold else "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/noto/NotoSans-Bold.ttf" if bold else "/usr/share/fonts/noto/NotoSans-Regular.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/TTF/DejaVuSans.ttf",
    ]
    for path in candidates:
        p = Path(path)
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size=size, index=0)
            except OSError:
                continue
    return ImageFont.load_default()


def render_icon() -> None:
    im = Image.open(SRC_ICON).convert("RGBA").resize((512, 512), Image.Resampling.LANCZOS)
    dest = OUT / "icon-512.png"
    im.save(dest, format="PNG")
    print(f"wrote {dest} {im.size} {im.mode} {dest.stat().st_size}B")


def lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))  # type: ignore[return-value]


def render_feature(locale: str, price: str, result: str, tagline: str) -> None:
    img = Image.new("RGB", (1024, 500), CREAM)
    draw = ImageDraw.Draw(img)
    for x in range(1024):
        draw.line([(x, 0), (x, 500)], fill=lerp(WINE, FOREST, x / 1023))

    draw.rounded_rectangle((152, 110, 872, 390), radius=28, fill=CREAM)
    title_font = font(64, bold=True)
    result_font = font(52, bold=True)
    tag_font = font(22, bold=False)
    arrow_font = font(48, bold=True)

    draw.text((192, 146), price, font=title_font, fill=WINE)
    draw.text((192, 228), "→", font=arrow_font, fill=MUTED)
    draw.text((262, 222), result, font=result_font, fill=FOREST)
    draw.text((192, 300), tagline, font=tag_font, fill=INK)
    draw.text((192, 336), "Life to Price", font=tag_font, fill=MUTED)

    dest = OUT / f"feature-graphic-{locale}.png"
    img.save(dest, format="PNG")
    print(f"wrote {dest} {img.size} {img.mode} {dest.stat().st_size}B")


def chrome_bin() -> str:
    for name in ("google-chrome-stable", "chromium", "google-chrome"):
        found = shutil.which(name)
        if found:
            return found
    raise SystemExit("Need google-chrome-stable or chromium to capture screenshots")


def render_screenshots() -> None:
    chrome = chrome_bin()
    html = PREVIEW.resolve().as_uri()
    for query_locale, folder in SCREEN_LOCALES.items():
        dest_dir = SHOTS / folder
        dest_dir.mkdir(parents=True, exist_ok=True)
        for scene, filename in SCENES.items():
            dest = dest_dir / filename
            url = f"{html}?locale={query_locale}&scene={scene}"
            subprocess.run(
                [
                    chrome,
                    "--headless=new",
                    "--disable-gpu",
                    "--hide-scrollbars",
                    "--force-device-scale-factor=1",
                    "--window-size=1080,1920",
                    f"--screenshot={dest}",
                    url,
                ],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            im = Image.open(dest)
            print(f"wrote {dest} {im.size} {im.mode} {dest.stat().st_size}B")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    render_icon()
    for locale, copy in FEATURE.items():
        render_feature(locale, *copy)
    render_screenshots()
    return 0


if __name__ == "__main__":
    sys.exit(main())

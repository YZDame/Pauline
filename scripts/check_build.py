#!/usr/bin/env python3
"""Check generated GitHub Pages paths and local links."""

from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
BASE = "/pauline/"


class AssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.urls: list[str] = []

    def handle_starttag(self, _tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.urls.append(value)


def local_target(url: str) -> Path | None:
    parsed = urlsplit(url)
    if parsed.scheme or parsed.netloc or url.startswith(("#", "mailto:", "tel:")):
        return None
    path = unquote(parsed.path)
    if not path.startswith(BASE):
        raise ValueError(f"本地链接未使用 {BASE} 基础路径：{url}")
    relative = path.removeprefix(BASE)
    target = DIST / relative
    if not relative or path.endswith("/"):
        target /= "index.html"
    return target


def main() -> None:
    html_files = sorted(DIST.rglob("*.html"))
    errors: list[str] = []
    for html_file in html_files:
        parser = AssetParser()
        parser.feed(html_file.read_text(encoding="utf-8"))
        for url in parser.urls:
            try:
                target = local_target(url)
            except ValueError as error:
                errors.append(f"{html_file.relative_to(DIST)}: {error}")
                continue
            if target is not None and not target.exists():
                errors.append(f"{html_file.relative_to(DIST)}: 断链 {url}")
    if len(html_files) != 91:
        errors.append(f"静态页数为 {len(html_files)}，应为 91")
    if errors:
        raise SystemExit("\n".join(f"ERROR: {error}" for error in errors[:30]))
    print(f"PASS: {len(html_files)} 个静态页面的 {BASE} 路径和本地链接均有效。")


if __name__ == "__main__":
    main()

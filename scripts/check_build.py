#!/usr/bin/env python3
"""Check generated GitHub Pages paths and local links."""

from __future__ import annotations

import os
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
DIST = Path(os.environ["PAULINE_OUT_DIR"]) if "PAULINE_OUT_DIR" in os.environ else ROOT / "dist"
BASE = "/Pauline/"


class AssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.urls: list[str] = []
        self.lang: str | None = None
        self.ignored_depth = 0
        self.untranslated: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style"}:
            self.ignored_depth += 1
        if tag == "html":
            self.lang = dict(attrs).get("lang")
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.urls.append(value)

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"}:
            self.ignored_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.lang == "en" and not self.ignored_depth and data.strip() != "中文" and re.search(r"[\u4e00-\u9fff]", data):
            self.untranslated.append(data.strip())


def local_target(url: str) -> Path | None:
    parsed = urlsplit(url)
    if url.startswith(("#", "mailto:", "tel:")):
        return None
    if (parsed.scheme or parsed.netloc) and parsed.netloc != "yzdame.github.io":
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
        expected_lang = "en" if html_file.is_relative_to(DIST / "en") else "zh-CN"
        if parser.lang != expected_lang:
            errors.append(f"{html_file.relative_to(DIST)}: lang 应为 {expected_lang}")
        if parser.untranslated:
            errors.append(f"{html_file.relative_to(DIST)}: 未翻译的文字 {parser.untranslated[:3]}")
        for url in parser.urls:
            try:
                target = local_target(url)
            except ValueError as error:
                errors.append(f"{html_file.relative_to(DIST)}: {error}")
                continue
            if target is not None and not target.exists():
                errors.append(f"{html_file.relative_to(DIST)}: 断链 {url}")
    if len(html_files) != 186:
        errors.append(f"静态页数为 {len(html_files)}，应为 186")
    if errors:
        raise SystemExit("\n".join(f"ERROR: {error}" for error in errors[:30]))
    print(f"PASS: {len(html_files)} 个静态页面的 {BASE} 路径、语言和链接均有效。")


if __name__ == "__main__":
    main()

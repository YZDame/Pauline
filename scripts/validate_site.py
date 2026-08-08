#!/usr/bin/env python3
"""Validate the committed, standalone public snapshot."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data" / "catalog.json"
EXPECTED = {"宝莲图鉴1": 32, "宝莲图鉴2": 20, "宝莲图鉴3": 18, "宝莲图鉴4（Pauline BNU）": 18}


def main() -> None:
    items = json.loads(DATA.read_text(encoding="utf-8"))
    errors: list[str] = []
    if len(items) != 88:
        errors.append(f"数据数量为 {len(items)}，应为 88")
    if dict(Counter(item["catalog"] for item in items)) != EXPECTED:
        errors.append("四册数量不符")
    ids = [item["id"] for item in items]
    if len(ids) != len(set(ids)):
        errors.append("作品 ID 不唯一")
    if sum(item["creationDate"] is None for item in items) != 5:
        errors.append("日期未详作品不是 5 件")
    if sum(item["reviewRequired"] for item in items) != 7:
        errors.append("待复核作品不是 7 件")

    for item in items:
        for key, expected_size in (("image", (1600, 1200)), ("thumbnail", (720, 540))):
            path = ROOT / "public" / item[key]
            if not path.exists():
                errors.append(f"缺少资产：{path.relative_to(ROOT)}")
                continue
            if path.stat().st_size > 5 * 1024 * 1024:
                errors.append(f"网页资产过大：{path.relative_to(ROOT)}")
            with Image.open(path) as image:
                if image.size != expected_size or image.mode != "RGBA":
                    errors.append(f"资产规格错误：{path.relative_to(ROOT)} {image.mode} {image.size}")

    forbidden = [
        path for path in ROOT.rglob("*")
        if path.is_file() and (path.suffix.lower() == ".pdf" or "原稿裁片" in path.name)
    ]
    if forbidden:
        errors.append(f"网站仓库含原稿/PDF：{forbidden[:3]}")
    if errors:
        raise SystemExit("\n".join(f"ERROR: {error}" for error in errors))
    print("PASS: 88 件作品、4 册数量、图片规格、待复核和公开边界均正确。")


if __name__ == "__main__":
    main()

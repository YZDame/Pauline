#!/usr/bin/env python3
"""Create the standalone public catalogue snapshot from the parent vault."""

from __future__ import annotations

import csv
import hashlib
import importlib.util
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


SITE_ROOT = Path(__file__).resolve().parents[1]
VAULT_ROOT = SITE_ROOT.parent
MANIFEST = VAULT_ROOT / "工作流" / "宝莲图鉴清单.csv"
DATA_OUTPUT = SITE_ROOT / "src" / "data" / "catalog.json"
DETAIL_DIR = SITE_ROOT / "public" / "images" / "works"
THUMB_DIR = SITE_ROOT / "public" / "images" / "thumbs"
EXPECTED_COUNTS = {"宝莲图鉴1": 32, "宝莲图鉴2": 20, "宝莲图鉴3": 18, "宝莲图鉴4（Pauline BNU）": 18}


def load_workflow_module():
    module_path = VAULT_ROOT / "工作流" / "baolian_digitize.py"
    spec = importlib.util.spec_from_file_location("baolian_digitize", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"无法读取工作流模块：{module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def split_values(value: str) -> list[str]:
    return [part.strip() for part in value.split("|") if part.strip()]


def git_blob_hash(path: Path) -> str | None:
    relative = path.relative_to(VAULT_ROOT).as_posix()
    result = subprocess.run(
        ["git", "-C", str(VAULT_ROOT), "ls-files", "-s", "--", relative],
        check=False,
        capture_output=True,
        text=True,
    )
    if not result.stdout.strip():
        return None
    return result.stdout.split()[1]


def file_blob_hash(path: Path) -> str:
    body = path.read_bytes()
    header = f"blob {len(body)}\0".encode()
    return hashlib.sha1(header + body).hexdigest()


def resolve_renamed_asset(expected: Path, used: set[Path]) -> Path:
    """Resolve an unstaged rename by matching the current file to the indexed blob."""
    if expected.exists():
        return expected
    blob = git_blob_hash(expected)
    if blob is None:
        raise FileNotFoundError(f"缺少电子化图片：{expected.relative_to(VAULT_ROOT)}")
    candidates = [
        path
        for path in expected.parent.glob("*-\u7535\u5b50\u5316.png")
        if path not in used and file_blob_hash(path) == blob
    ]
    if len(candidates) != 1:
        raise RuntimeError(
            f"无法唯一解析已改名图片：{expected.relative_to(VAULT_ROOT)} "
            f"(内容匹配 {len(candidates)} 项)"
        )
    print(f"INFO: 按内容哈希解析改名 {expected.name} -> {candidates[0].name}")
    return candidates[0]


def save_webp(source: Image.Image, detail: Path, thumb: Path) -> None:
    source.save(detail, "WEBP", quality=90, method=6, exact=True)
    resized = source.resize((720, 540), Image.Resampling.LANCZOS)
    resized.save(thumb, "WEBP", quality=88, method=6, exact=True)


def find_font(size: int, bold: bool = False):
    candidates = [
        Path("/System/Library/Fonts/PingFang.ttc"),
        Path("/System/Library/Fonts/STHeiti Medium.ttc"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size=size, index=0)
    return ImageFont.load_default()


def make_social_card(items: list[dict]) -> None:
    canvas = Image.new("RGB", (1200, 630), "#f4f0e7")
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((56, 52, 1144, 578), outline="#cfc6b7", width=2)
    draw.ellipse((82, 82, 132, 132), outline="#9d2d2d", width=2)
    draw.text((99, 88), "P", font=find_font(27, True), fill="#9d2d2d")
    draw.text((160, 78), "宝莲图鉴", font=find_font(48, True), fill="#26231f")
    draw.text((163, 137), "PAULINE ARCHIVE  /  2017—2024", font=find_font(19), fill="#716b62")
    selected = [items[0], items[len(items) // 2], items[-1]]
    for index, item in enumerate(selected):
        image = Image.open(SITE_ROOT / "public" / item["image"]).convert("RGBA")
        image.thumbnail((370, 278), Image.Resampling.LANCZOS)
        x = 42 + index * 376
        y = 230 + (index % 2) * 12
        canvas.paste(image, (x, y), image)
    draw.text((84, 536), "4 CATALOGUES  ·  88 WORKS", font=find_font(18, True), fill="#9d2d2d")
    canvas.save(SITE_ROOT / "public" / "og.png", optimize=True)


def make_favicon() -> None:
    icon = Image.new("RGBA", (128, 128), "#f4f0e7")
    draw = ImageDraw.Draw(icon)
    draw.ellipse((10, 10, 118, 118), outline="#9d2d2d", width=5)
    font = find_font(68, True)
    box = draw.textbbox((0, 0), "P", font=font)
    draw.text(((128 - (box[2] - box[0])) / 2, 18), "P", font=font, fill="#9d2d2d")
    icon.save(SITE_ROOT / "public" / "favicon.png", optimize=True)


def main() -> None:
    workflow = load_workflow_module()
    with MANIFEST.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))

    if len(rows) != 88:
        raise RuntimeError(f"清单应有 88 行，实际为 {len(rows)}")
    counts = Counter(row["catalog"] for row in rows)
    if dict(counts) != EXPECTED_COUNTS:
        raise RuntimeError(f"四册数量不符：{dict(counts)}")

    DATA_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    DETAIL_DIR.mkdir(parents=True, exist_ok=True)
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    for directory in (DETAIL_DIR, THUMB_DIR):
        for stale in directory.glob("*.webp"):
            stale.unlink()

    items: list[dict] = []
    ids: set[str] = set()
    used_sources: set[Path] = set()
    for row in rows:
        catalog_folder = row["catalog_folder"]
        catalog_number = int(catalog_folder.removeprefix("宝莲图鉴"))
        catalog_order = int(row["catalog_order"])
        stable_id = f"b{catalog_number}-{catalog_order:02d}"
        if stable_id in ids:
            raise RuntimeError(f"重复稳定 ID：{stable_id}")
        ids.add(stable_id)

        expected, _ = workflow.asset_paths(VAULT_ROOT, row)
        source_path = resolve_renamed_asset(expected, used_sources)
        used_sources.add(source_path)
        with Image.open(source_path) as opened:
            source = opened.convert("RGBA")
            if source.size != (1600, 1200) or opened.mode != "RGBA":
                raise RuntimeError(f"电子图规格错误：{source_path} {opened.mode} {opened.size}")
            alpha = source.getchannel("A")
            if any(alpha.getpixel(point) != 0 for point in ((0, 0), (1599, 0), (0, 1199), (1599, 1199))):
                raise RuntimeError(f"四角不透明：{source_path}")
            detail_path = DETAIL_DIR / f"{stable_id}.webp"
            thumb_path = THUMB_DIR / f"{stable_id}.webp"
            save_webp(source, detail_path, thumb_path)

        title = workflow.note_slug(row)
        creation_date = row["creation_date"].strip() or None
        item = {
            "id": stable_id,
            "slug": stable_id,
            "title": title,
            "catalog": row["catalog"],
            "catalogNumber": catalog_number,
            "catalogOrder": catalog_order,
            "generationNumber": int(row["generation_number"]),
            "generation": row["generation"],
            "branch": row["branch"].strip() or None,
            "code": split_values(row["code"]),
            "color": split_values(row["color"]),
            "collection": split_values(row["collection"]),
            "creationDate": creation_date,
            "year": creation_date[:4] if creation_date else None,
            "reviewRequired": row["review_required"].strip().lower() == "true",
            "image": f"images/works/{stable_id}.webp",
            "thumbnail": f"images/thumbs/{stable_id}.webp",
            "width": 1600,
            "height": 1200,
        }
        items.append(item)

    DATA_OUTPUT.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    make_social_card(items)
    make_favicon()
    print(f"PASS: 已生成 {len(items)} 条数据、{len(items)} 张详情图和 {len(items)} 张缩略图。")


if __name__ == "__main__":
    main()

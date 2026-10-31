import type { CatalogItem } from "../types";

export function dateSortValue(date: string | null): string {
  if (!date) return "9999-99-99";
  const [year, month = "00", day = "00"] = date.split("-");
  return `${year}-${month}-${day}`;
}

export function byCreationDate(a: CatalogItem, b: CatalogItem): number {
  const byDate = dateSortValue(a.creationDate).localeCompare(dateSortValue(b.creationDate));
  if (byDate !== 0) return byDate;
  return a.catalogNumber - b.catalogNumber || a.catalogOrder - b.catalogOrder;
}

export function shortWorkLabel(work: CatalogItem): string {
  return ["Pauline", work.branch, work.generation].filter(Boolean).join(" · ");
}

export function workSearchText(work: CatalogItem): string {
  return [
    work.title,
    work.catalog,
    work.branch,
    work.generation,
    ...work.code,
    ...work.color,
    ...work.collection,
    work.creationDate,
  ].filter(Boolean).join(" ").toLocaleLowerCase();
}

export function seriesAnchor(name: string): string {
  const anchors: Record<string, string> = {
    "正代": "main-line",
    "Sheett": "sheett",
    "5XD": "5xd",
    "Trigonometric Function": "trigonometric-function",
    "PLY": "ply",
    "Basketball": "basketball",
    "BNU": "bnu",
    "Cambridge": "cambridge",
    "Graduation": "graduation",
  };
  return anchors[name] ?? encodeURIComponent(name.toLocaleLowerCase().replaceAll(" ", "-"));
}

export function yearRange(items: CatalogItem[]): string {
  const years = [...new Set(items.map((item) => item.year).filter(Boolean))] as string[];
  years.sort();
  if (years.length === 0) return "日期未详";
  return years.length === 1 ? years[0] : `${years[0]}–${years.at(-1)}`;
}

export function dateRange(items: CatalogItem[]): string {
  const dates = items.map((item) => item.creationDate).filter(Boolean) as string[];
  dates.sort();
  if (dates.length === 0) return "日期未详";
  const first = dates[0].replaceAll("-", ".");
  const last = dates.at(-1)!.replaceAll("-", ".");
  return first === last ? first : `${first}–${last}`;
}

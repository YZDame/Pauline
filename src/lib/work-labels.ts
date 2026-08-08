import type { CatalogItem } from "../types";

export function versionLabel(work: CatalogItem): string {
  return ["Pauline", work.branch, work.generation, ...work.code]
    .filter(Boolean)
    .join(" · ");
}

export function dateLabel(date: string | null): string {
  return date ? date.replaceAll("-", ".") : "日期未详";
}

export function workStory(work: CatalogItem): string {
  const version = versionLabel(work);
  const date = dateLabel(work.creationDate);
  const series = work.collection.length > 0 ? `，属于 ${work.collection.join(" / ")} 系列` : "";
  return work.creationDate
    ? `${version} 创作于 ${date}${series}。`
    : `${version} 的创作日期未详${series}。`;
}

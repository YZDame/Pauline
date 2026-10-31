import type { CatalogItem } from "../types";
import type { Locale } from "./i18n";

export function versionLabel(work: CatalogItem): string {
  return ["Pauline", work.branch, work.generation, ...work.code]
    .filter(Boolean)
    .join(" · ");
}

export function dateLabel(date: string | null, locale: Locale = "zh"): string {
  return date ? date.replaceAll("-", ".") : (locale === "en" ? "Undated" : "日期未详");
}

export function workStory(work: CatalogItem, locale: Locale = "zh"): string {
  const version = versionLabel(work);
  const date = dateLabel(work.creationDate, locale);
  if (locale === "en") return [version, date, ...work.collection].join(" · ");
  const series = work.collection.length > 0 ? `，属于 ${work.collection.join(" / ")} 系列` : "";
  return work.creationDate
    ? `${version} 创作于 ${date}${series}。`
    : `${version} 的创作日期未详${series}。`;
}

import type { CatalogItem } from "../types";

export type Locale = "zh" | "en";

const english: Record<string, string> = {
  "宝莲图鉴": "Pauline Archive",
  "首页": "Home",
  "时间线": "Timeline",
  "系列线": "Series",
  "照片墙": "Gallery",
  "第一册": "Volume I",
  "第二册": "Volume II",
  "第三册": "Volume III",
  "第四册": "Volume IV",
  "四册、八十八件鞋履手稿，从 2017 年的第一双到 2024 年的毕业篇。": "88 shoe designs in four volumes, 2017–2024.",
  "八十八件，四册归档": "The archive",
  "件电子化作品": "Designs",
  "册原始图鉴": "Volumes",
  "创作年份": "Years",
  "两条支线与六组系列": "Branches & collections",
  "四册索引": "Four volumes",
  "浏览本册": "Browse volume",
  "系列": "Collections",
  "查看完整系列线": "All collections",
  "进入系列": "View collection",
  "作品选页": "Selected works",
  "查看全部 88 件": "All 88 works",
  "全部作品": "All works",
  "打开全部作品": "Browse all works",
  "进入照片墙": "Explore the archive",
  "切换四册代表作品": "Featured work from each volume",
  "系列与支线": "Collections & branches",
  "谱系总览": "Overview",
  "88 件作品 · 4 册图鉴": "88 works · 4 volumes",
  "主线": "Main line",
  "支线": "Branch",
  "正代": "Main line",
  "创作线": "Lines",
  "第一册支线": "Volume I branch",
  "同一册主线": "Volume I main line",
  "同册并行支线": "Volume I branch",
  "所属创作主线": "Main line",
  "共享 3 件": "3 shared works",
  "共享 1 件": "1 shared work",
  "共享全部 3 件": "3 shared works",
  "共享这件作品": "1 shared work",
  "3 件共享作品": "3 shared works",
  "1 件共享作品": "1 shared work",
  "系列索引": "Collections",
  "系列分类": "Collections and branches",
  "关联": "Related",
  "在照片墙中查看全部": "View all works",
  "件作品": "Works",
  "件": "works",
  "日期未详": "Undated",
  "未详": "Undated",
  "按年份跳转": "Browse by year",
  "搜索": "Search",
  "代号、系列或作品名称": "Name, code or collection",
  "册次": "Volume",
  "全部四册": "All volumes",
  "年份": "Year",
  "全部年份": "All years",
  "全部系列与支线": "All collections & branches",
  "重置": "Reset",
  "作品照片墙": "Works",
  "没有符合条件的作品": "No matching works",
  "清除筛选": "Clear filters",
  "关闭预览": "Close preview",
  "关闭": "Close",
  "查看完整作品": "View work",
  "返回照片墙": "Back to gallery",
  "所属图鉴": "Volume",
  "代际": "Generation",
  "色彩标记": "Colour",
  "未归入系列": "—",
  "未记录": "—",
  "作品翻页": "Previous and next works",
  "上一件": "Previous",
  "下一件": "Next",
  "Pauline 正代": "Pauline main line",
  "页面未找到": "Page not found",
  "这一页不在当前图鉴中。": "Page not found.",
  "返回宝莲图鉴": "Back to the archive",
  "页脚导航": "Footer navigation",
  "全部 88 件作品": "All 88 works",
  "作品与图像保留全部权利": "All rights reserved.",
  "宝莲图鉴首页": "Pauline Archive home",
  "主导航": "Main navigation",
  "移动端主导航": "Mobile navigation",
  "菜单": "Menu",
  "深色": "Dark",
  "浅色": "Light",
  "切换深色模式": "Switch to dark mode",
  "切换浅色模式": "Switch to light mode",
  "跳到内容": "Skip to content",
  "宝莲图鉴，四册共 88 件鞋履手稿，记录 2017–2024 年的创作线。": "Pauline Archive. 88 shoe designs across four volumes, 2017–2024.",
  "按原稿日期顺序浏览宝莲图鉴的 88 件作品。": "The Pauline Archive, 2017–2024.",
  "查看宝莲图鉴正代、支线与六组系列之间的分类和共享作品关系。": "Pauline collections and branches.",
  "搜索并筛选宝莲图鉴全部 88 件作品，保留快速照片墙预览。": "All 88 designs in the Pauline Archive.",
  "丑": "Chou",
  "2-9 联队": "2-9 United",
  "23班": "Class 23",
  "斗米之迷": "Doumi Mystery",
  "武汉加油": "Stay Strong, Wuhan",
  "中考": "High School Entrance Exam"
};

export function translate(text: string, locale: Locale): string {
  return locale === "en" ? (english[text] ?? text) : text;
}

export function pageContext(url: URL) {
  const configuredBase = import.meta.env.BASE_URL;
  const assetBase = configuredBase.endsWith("/") ? configuredBase : `${configuredBase}/`;
  const locale: Locale = url.pathname.startsWith(`${assetBase}en/`) ? "en" : "zh";
  const base = locale === "en" ? `${assetBase}en/` : assetBase;
  const relativePath = url.pathname.slice(base.length);
  const is404 = /^404(?:\.html|\/)?$/.test(relativePath);
  const chinesePath = `${assetBase}${is404 ? "404.html" : relativePath}`;
  const englishPath = `${assetBase}en/${is404 ? "404/" : relativePath}`;
  return { locale, assetBase, base, chinesePath, englishPath, t: (text: string) => translate(text, locale) };
}

export function localizeWork(work: CatalogItem, locale: Locale): CatalogItem {
  if (locale === "zh") return work;
  const code = work.code.map((name) => translate(name, locale));
  return {
    ...work,
    title: ["Pauline", work.branch, work.generation, ...code].filter(Boolean).join(" · "),
    catalog: `Volume ${work.catalogNumber}${work.catalogNumber === 4 ? " (Pauline BNU)" : ""}`,
    code,
    color: work.color.map((name) => translate(name, locale)),
  };
}

export function workCount(count: number, locale: Locale): string {
  return locale === "en" ? `${count} ${count === 1 ? "work" : "works"}` : `${count} 件作品`;
}

# 宝莲图鉴 / Pauline Archive

宝莲图鉴的公开静态网站，展示 2017–2024 年间四册图鉴共 88 件电子化作品。

## 本地开发

```bash
npm install
npm run sync
npm run dev
```

`npm run sync` 从上一级宝莲手稿 Vault 读取 `工作流/宝莲图鉴清单.csv` 和 88 张电子化 PNG，生成可独立构建的数据快照和 WebP 资产。不要手工编辑 `src/data/catalog.json` 或 `public/images/` 下的文件。

## 验证与构建

```bash
npm run test:data
npm run build
```

GitHub Actions 会在 `main` 分支每次推送后构建并发布到 [yzdame.github.io/Pauline](https://yzdame.github.io/Pauline/)。

## 公开边界

仓库只包含网站源码、必要元数据和优化后的电子化作品。原始 PDF、原稿裁片、Obsidian 笔记和生成中间文件不对外发布。图像作品保留全部权利。

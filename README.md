# 中醫處方實驗室 · TCM SQL Lab

中醫臨床資料庫的 SQL 互動查詢課程作品。亮色工作介面、瀏覽器內 SQLite、互動 ERD、12 題查詢，以及修改前後的真實結果比較。

**[開啟網站](https://tab-etuc.github.io/tcm-sql-lab/)**

## 四個作業章節

| 老師要求 | 網站畫面 | 實作內容 |
| --- | --- | --- |
| 案例背景 | `#case` | 中醫師、研究助理與學生的任務；可切換的病例與方藥關聯路徑 |
| 資料庫設計 | `#database` | 九表 ERD、欄位型別、PK/FK、限制、前十筆樣本與設計理由 |
| 查詢操作 | `#query` | 12 題、可編輯 SQL、預期／實際結果、原生 SQLite 錯誤與中文提示 |
| 結果比較 | `#compare` | 原版／修改範例／我的 SQL、增減列、排序與欄位差異、原因說明 |

48 筆教學病例的詞彙與欄位參考中國醫門診教學病例，方劑組成取自衛福部文件。網站以這份固定資料呈現病例分布、方劑使用次數與查詢結果。

## 本機執行

使用 Node.js 22：

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

`npm test` 檢查九表配額、外來鍵、唯一主證、症狀一致性、24 段 SQL 的筆數與關鍵內容、重複列比較及重建種子。

`node tests/browser-smoke.mjs` 使用本機 Chrome 測試正式站預覽（預設 `http://127.0.0.1:4173/`）。可透過 `CHROME_PATH` 指定 Chrome 執行檔、`TEST_URL` 指定正式站。涵蓋 12 題執行與比較、錯誤、空結果、下載、手機導覽、三種寬度與 reduced motion。

## 固定資料

| 資料表 | 筆數 |
| --- | ---: |
| clinical_case | 48 |
| syndrome | 8 |
| case_syndrome | 54 |
| symptom | 24 |
| case_symptom | 144 |
| formula | 10 |
| herb | 49 |
| formula_herb | 86 |
| case_formula | 46 |

九表種子、欄位字典與衍生統計共用 `src/data.js`。題庫、原版／修改版 SQL 與逐題說明在 `src/queries.js`。每次執行都從相同 SQLite 位元資料重建，並開啟 `query_only`。運算在 Web Worker 中進行；超過 8 秒可自動停止，亦可手動取消。結果最多 2,000 列，一次最多八組結果，畫面顯示最後一組。超過限制時會顯示錯誤與調整查詢的提示。

結果比較使用**多重集合差集**，保留重複列次數；欄位不同時，先提示對齊欄位再比較各列內容。內容相同但順序不同會明確說明。編輯草稿與已完成題數存於本機 localStorage。

## 部署

推送至 `main` 後，GitHub Actions 執行資料測試、Vite 建置與 GitHub Pages 部署。Repository 的 Settings → Pages → Source 設為 **GitHub Actions**。部署資產為 `dist`；程式、字型與 SQLite WASM 都由同一個 Pages 站點提供。

Vite `base: './'` 和 hash 導覽支援 Pages 專案子路徑。這是需要 HTTP(S) 的 ES module / Web Worker 應用，請透過預覽伺服器或 GitHub Pages 開啟。

## 設計與說明

- [課堂口頭說明筆記](docs/EXPLAIN.md)
- [資料來源](docs/SOURCES.md)
- [.taste-skill/design-notes.md](.taste-skill/design-notes.md)：Framed sheet，seed 192751434
- [.taste-skill/critique.md](.taste-skill/critique.md)：截圖檢查與修改紀錄
- `public/tcm_sql_erd.svg`、`public/tcm_sql_design_spec.md`：資料庫設計文件與 ERD

使用 IBM Plex Sans 與 IBM Plex Mono；中文字形依系統繁體中文字型呈現。關聯圖與數據圖直接由資料產生。第三方授權見 `public/licenses/`。

# 五豐 Ng Fung 凍肉海產資訊平台

為香港凍肉門店及貿易商提供官方市場數據、期貨報價目錄與 AI 市場情報。

## 頁面

| 路徑 | 內容 |
|------|------|
| `/` | 期貨報價目錄（手動維護 `src/data/catalog-products.ts`） |
| `/market` | 香港 FEHD、內地肉價、CME 期貨、海產指數 |
| `/news` | 市場情報（通義千問 Web Search + RSS 增強） |

## 數據來源

| 數據 | 方式 | API Key |
|------|------|---------|
| 香港 FEHD | 每日爬蟲 | — |
| 內地肉價 | 農業農村部爬蟲 | — |
| CME 期貨 | Stooq | — |
| 海產指數 | FRED | `FRED_API_KEY`（可選） |
| 市場情報 | 通義千問 | `DASHSCOPE_API_KEY` |

## 自動更新

GitHub Actions 每日 03:00（香港時間）執行：

1. `fetch-fehd-data.cjs` — FEHD 價格與歷史
2. `fetch-mainland-meat.cjs` — 內地豬牛價
3. `fetch-international-market.cjs` — CME + 海產
4. `fetch-ai-news.cjs` — AI 新聞（內部調用 `scrape-news.cjs` 作 RSS 補充）

輸出寫入 `public/data/market-data.json`、`public/data/news-articles.json`。

在 GitHub 倉庫 Settings → Secrets 配置：

- `DASHSCOPE_API_KEY` — 市場情報
- `FRED_API_KEY` — 海產指數自動更新（可選）

## 本地開發

```bash
cp .env.example .env   # 填入 API Key
npm install
npm run dev
npm run build
npm run update-data    # 手動拉取全部數據
```

## 項目結構

```
.github/workflows/auto-update.yml
public/data/              # 前端讀取的 JSON
scripts/
  fetch-fehd-data.cjs
  fetch-mainland-meat.cjs
  fetch-international-market.cjs
  fetch-ai-news.cjs       # 依賴 scrape-news.cjs、qwen-client.cjs
src/
  pages/                  # 三個路由頁
  sections/               # MarketData、BusinessDashboard、FuturesCatalog
  lib/                    # 前端工具與繁中本地化
```

## 技術棧

React 19 · TypeScript · Vite · Tailwind CSS · GSAP · Recharts · React Router

## 聯繫

- 郵箱：zhangkailiang12@nfh.hk
- 電話：+852 3174 4288
- 地址：香港西九龍欽州街西89號潤發大廈3樓

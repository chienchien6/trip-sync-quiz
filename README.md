# TRIP SYNC

TRIP SYNC 是一個以「旅行人格」為入口的旅遊內容網站。它不是單純列目的地清單，而是先理解使用者偏好的旅行節奏、預算、交通方式、避雷條件與探索風格，再把這些線索整理成更容易執行的旅行建議。

網站目前結合兩個方向：

- 旅行人格測驗：用情境題幫使用者理解自己適合的旅行模式。
- 旅行指南文章：用實地經驗、官方資料查核、預算與交通判斷，把目的地寫成真的可以規劃的路線。

## 網站方向

TRIP SYNC 的內容重點不是「最熱門景點」或「必去清單」，而是回答旅行規劃裡更實際的問題：

- 這個目的地適合什麼樣的人？
- 第一次去時，哪些選擇最省心？
- 哪些交通、住宿、季節或預算細節容易被低估？
- 怎麼把旅遊靈感變成走得動、睡得飽、可以真的執行的行程？

文章會保留個人實地經驗，但也會標出資料來源，讓讀者知道哪些是親身體驗，哪些需要出發前再回官方網站確認。

## 目前功能

- Vue 3 + Vite 單頁網站
- 旅行人格測驗與結果頁
- 旅行指南列表與文章頁
- 指南文章支援封面圖、段落圖片、結尾圖片、提醒框、行程、檢查清單、資料來源與相關文章
- 本機內容後台，可新增、編輯、刪除、排序文章
- 後台支援草稿 / 已發布狀態
- 後台圖片上傳到 `public/guide-covers` 或 `public/guide-images`
- GitHub Pages 自動部署

## 本機開發

先進入專案資料夾：

```bash
cd "/Users/chienchien/Documents/Travel 心/Travel"
```

啟動開發伺服器：

```bash
pnpm dev
```

前台網址通常是：

```text
http://127.0.0.1:5173/trip-sync-quiz/
```

後台網址是在同一個網址後面加上 `#/admin`：

```text
http://127.0.0.1:5173/trip-sync-quiz/#/admin
```

如果 `5173` 被占用，Vite 會自動改用其他 port，例如 `5174`，請以終端機顯示的網址為準。

## 內容管理

指南文章資料儲存在：

```text
src/data/guides.json
```

本機後台會直接讀寫這個檔案。編輯流程是：

```text
打開後台 → 修改文章 → 按「儲存全部」→ commit → push
```

圖片資料夾：

```text
public/guide-covers
public/guide-images
```

注意：GitHub Pages 上的線上後台無法直接寫回 repo。正式內容更新仍需在本機後台儲存後，透過 Git commit 和 push 發布。

## 建置

```bash
pnpm build
```

本機預覽 build 結果：

```bash
pnpm preview
```

## 部署

此 repo 已設定 GitHub Actions。推送到 `main` 後會自動建置並部署到 GitHub Pages。

```bash
git add .
git commit -m "Update travel guide content"
git push origin main
```

部署流程定義在：

```text
.github/workflows/deploy-pages.yml
```

## 技術

- Vue 3
- Vite
- TypeScript
- GitHub Pages
- GitHub Actions


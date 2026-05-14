# WebAR 展場互動頁

這是一個部署於 GitHub Pages 的靜態 WebAR 展場互動專案。使用者用手機瀏覽器開啟網址並授權相機後，可掃描指定圖標、海報或立牌，觸發 2D 圖片、3D 模型或影片內容。

本專案不做 App 化，不需要後端、不需要登入、不收集個資，目標是提供展場現場可快速開啟、低摩擦使用的互動體驗。

## 功能目標

- 手機瀏覽器開啟 WebAR 頁面
- 掃描指定圖像 target
- 顯示 2D 圖片
- 顯示 3D 模型
- 播放影片
- 支援多個展區 target
- 提供不支援 AR 時的 fallback 預覽
- 可選支援 Android WebXR 空間平面放置

## 建議技術

- Vite
- TypeScript
- MindAR
- Three.js 或 A-Frame
- model-viewer
- GitHub Pages

## 目前實作

已建立第一階段前端骨架：

- Vite + TypeScript 靜態網站
- MindAR + Three.js 掃描流程封裝
- `model-viewer` fallback 預覽
- 展區 target / 素材設定檔
- 手機優先的掃描與預覽介面
- GitHub Pages 相容的相對路徑設定

主要入口：

```text
index.html
src/main.ts
src/ui/WebArApp.ts
src/ar/MindArSession.ts
src/config/exhibits.ts
src/types/exhibit.ts
```

本機執行：

```powershell
npm install
npm run dev
```

建置：

```powershell
npm run build
```

部署：

- GitHub repo：`https://github.com/hwudigidev-creator/web-xr-111`
- 部署方式：GitHub Actions 建置後發布 GitHub Pages
- Workflow：`.github/workflows/deploy-pages.yml`
- 觸發方式：push 到 `main` 或手動執行 workflow

## 支援裝置

主要支援手機瀏覽器：

- Android Chrome：主要驗收環境
- iOS Safari：支援 image tracking 與 fallback，但不承諾完整 WebXR 平面定位

展場若可控設備，建議使用 Android Chrome 測試機。

## 素材格式

### 圖標 target

- 建議使用高對比、多細節、非重複圖案
- 避免純 Logo、大片空白、重複紋理
- 每張 target 需預先編譯為 `.mind`

### 3D 模型

- 主格式：`.glb`
- 建議單一模型小於 5MB
- 需要 iOS Quick Look 時另備 `.usdz`

### 影片

- 格式：MP4
- 編碼：H.264
- 建議 720p 或以下
- autoplay 預設 muted
- 有聲音播放需使用者互動

## 建議資料夾

```text
public/
  assets/
    images/
    models/
    videos/
  targets/
src/
  ar/
  components/
  config/
  types/
```

## 建議設定檔

目前程式使用 `src/config/exhibits.ts` 作為展區設定來源。為相容 GitHub Pages 子路徑，素材路徑建議不要用開頭 `/`，而是使用 `assets/...`、`targets/...`。

```json
[
  {
    "id": "poster-a",
    "name": "展區 A",
    "target": "targets/poster-a.mind",
    "type": "video",
    "asset": "assets/videos/a.mp4",
    "width": 1,
    "height": 0.5625,
    "autoplay": true,
    "muted": true,
    "onLost": "pause"
  }
]
```

## 使用流程

1. 使用者掃 QR Code 進入網站
2. 點擊開始
3. 授權相機
4. 對準展場圖標
5. 掃描成功後顯示 AR 內容
6. 可切換掃描其他圖標或進入 fallback 預覽

## 驗收重點

- GitHub Pages 可正常開啟
- HTTPS 正常
- 手機可授權相機
- target 可被穩定辨識
- 2D / 3D / 影片內容顯示正確
- Android Chrome 實機測試通過
- iOS Safari 至少通過 image tracking 或 fallback

## 不做範圍

- 不做 App
- 不做會員登入
- 不做後台 CMS
- 不做資料蒐集
- 不做多人同步
- 不保證所有手機完整支援平面定位

## 開發建議

第一階段先完成一個最小可跑版本：

- 一張 target
- 一個 2D 圖片內容
- 一個 GLB 模型內容
- 一個 MP4 影片內容
- fallback 預覽頁
- GitHub Pages 部署

確認手機實機穩定後，再擴充多 target 與展場完整內容。

## 素材替換位置

目前 repo 只放可視覺檢查的 SVG 佔位圖，真正 AR 測試前需替換：

```text
public/targets/*.mind
public/assets/models/*.glb
public/assets/videos/*.mp4
src/config/exhibits.ts
```

若 target 圖像更換，必須重新編譯 `.mind`，否則掃描會失敗。

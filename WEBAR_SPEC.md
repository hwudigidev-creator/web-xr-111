# WebAR 展場互動 SPEC

## 1. 專案定位

本專案為架設於 GitHub Pages 的靜態 WebAR 展場互動頁。使用者透過手機瀏覽器開啟網址，授權相機後掃描指定圖標、海報、立牌或展品標籤，觸發 2D 圖片、3D 模型或影片內容。

本案不做 App 化、不上架 App Store / Google Play、不做會員系統、不做後台管理，優先完成可在展場穩定展示的低摩擦互動體驗。

## 2. 部署規格

- 部署平台：GitHub Pages
- 網站型態：純靜態網站
- 必須使用 HTTPS
- 不需要後端服務
- 不需要資料庫
- 不需要登入
- 素材可放在 repo 內或外部 CDN
- 不收集個資
- 不保存或上傳使用者相機影像

## 3. 目標裝置

- 主要裝置：手機瀏覽器
- Android：Chrome 優先，作為主要驗收環境
- iOS：Safari 可支援相機與圖像辨識，但不承諾完整 WebXR 平面定位
- 桌機：僅作為開發預覽與 fallback 檢查，不作為主要體驗裝置

若展場可控設備，建議指定 Android Chrome 測試機，避免 iOS WebXR 支援差異造成現場不穩。

## 4. 核心功能

### 4.1 圖標掃描

- 支援掃描指定圖像 target
- 支援多個 target
- 每個 target 可綁定不同 AR 內容
- 掃描成功時觸發 found 狀態
- 掃描遺失時觸發 lost 狀態
- 畫面需提供 loading / scanning / found / lost 狀態提示

### 4.2 內容類型

支援以下內容：

- 2D 圖片：PNG / JPG / WebP
- 3D 模型：GLB / glTF
- 影片：MP4 / H.264

### 4.3 顯示行為

- 2D 圖片貼合於圖標平面
- 3D 模型可定位於圖標上方或圖標中心
- 影片可作為圖標平面上的 video texture
- marker lost 時可依設定隱藏內容、暫停影片或保留最後狀態

## 5. AR 模式

### 5.1 Image Tracking Mode

主要模式。使用者掃描圖標後，內容跟隨圖標平面顯示。

適用情境：

- 展場海報
- 桌卡
- 立牌
- DM
- 產品包裝
- 說明牌

### 5.2 World Placement Mode

可選模式。若裝置支援 WebXR hit-test，允許使用者將 3D 模型放置在空間平面上。

限制：

- Android Chrome + ARCore 支援度較佳
- iOS Safari 不承諾支援 WebXR hit-test
- 不作為本案核心驗收條件，除非另行指定

### 5.3 Fallback Mode

當裝置不支援 AR 或使用者拒絕相機權限時，顯示一般 2D / 3D 預覽頁。

fallback 至少需提供：

- target 清單
- 圖片預覽
- 3D 模型預覽
- 影片播放

## 6. 推薦技術棧

- Vite：靜態網站與開發伺服器
- TypeScript：互動邏輯
- MindAR：圖像辨識
- Three.js 或 A-Frame：3D 與 AR 場景
- model-viewer：3D 預覽與簡易 AR fallback
- GitHub Pages：部署
- GitHub Actions：可選，自動建置與發布

## 7. 圖標素材規格

### 7.1 圖像要求

- 高對比
- 多細節
- 非重複圖案
- 避免大面積空白
- 避免純文字或純 Logo
- 避免高度對稱的圖形
- 建議長邊至少 1000px
- 實體印刷建議霧面，降低反光

### 7.2 不建議使用

- 單色 Logo
- QR Code 當作主要 AR target
- 條紋、棋盤格等重複圖案
- 低解析截圖
- 高反光材質
- 過度透明或金屬材質印刷

### 7.3 編譯要求

- 每張 target 需預先編譯為 `.mind` 檔
- target 圖與 `.mind` 檔需版本一致
- 更換圖像後必須重新編譯
- 上線前需用實體印刷物測試，不只測螢幕圖

## 8. 3D 素材規格

- 主格式：`.glb`
- 建議單一模型小於 5MB
- 單一模型盡量不超過 15MB
- 貼圖需壓縮
- 避免 4K 大貼圖
- 單位統一使用 meter
- 模型原點需整理乾淨
- 面數需控制，避免手機過熱或掉幀
- 若需 iOS Quick Look 原生 AR，需另備 `.usdz`

## 9. 影片素材規格

- 格式：MP4
- 編碼：H.264
- 建議解析度：720p 或以下
- autoplay 影片預設 muted
- 有聲音的影片需使用者點擊啟動
- marker found 時可依設定播放或續播
- marker lost 時可依設定暫停、停止或隱藏
- 影片長度不宜過長，避免載入等待過久

## 10. 使用流程

1. 使用者在展場掃 QR Code 進入 WebAR 網址
2. 首頁顯示開始按鈕與相機權限說明
3. 使用者點擊開始
4. 瀏覽器請求相機權限
5. 進入掃描畫面
6. 使用者將鏡頭對準指定圖標
7. 掃描成功後顯示對應 2D / 3D / 影片內容
8. 使用者可重新掃描其他圖標
9. 若支援 World Placement，可切換空間放置模式
10. 若不支援 AR，進入 fallback 預覽頁

## 11. 建議資料結構

實作檔案為 `src/config/exhibits.ts`。為支援 GitHub Pages 子路徑部署，路徑使用 `targets/...`、`assets/...` 這種相對 public root 的格式，不使用開頭 `/`。

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
  },
  {
    "id": "poster-b",
    "name": "展區 B",
    "target": "targets/poster-b.mind",
    "type": "model",
    "asset": "assets/models/b.glb",
    "scale": 0.4,
    "onLost": "hide"
  }
]
```

## 12. 建議資料夾結構

```text
public/
  assets/
    images/
    models/
    videos/
  targets/
    poster-a.mind
    poster-b.mind
src/
  ar/
  components/
  config/
  types/
WEBAR_SPEC.md
WEBAR_README.md
```

## 13. 驗收標準

- GitHub Pages 可正常開啟
- 網站透過 HTTPS 載入
- 手機可成功請求相機權限
- 至少 3 個 target 可被辨識
- 每個 target 可顯示指定內容
- 2D 圖片顯示比例正確
- 3D 模型可正常載入且不嚴重掉幀
- 影片可播放、暫停與重新觸發
- Android Chrome 實機測試通過
- iOS Safari 至少通過 Image Tracking 或 fallback
- 展場光線下辨識穩定
- marker lost / found 行為符合設定

## 14. 不做範圍

- 不做 App
- 不做會員登入
- 不做後台 CMS
- 不做資料蒐集
- 不做多人同步
- 不做即時雲端辨識
- 不做精準室內定位
- 不保證所有手機都有完整平面定位
- 不承諾 iOS Safari 支援 WebXR hit-test

## 15. 主要風險

- iOS WebXR 支援不完整
- 圖標設計不良會導致辨識不穩
- 展場光線、反光、遮擋會影響追蹤
- 3D 模型過大會造成載入慢與掉幀
- 影片 autoplay 受瀏覽器限制
- GitHub Pages 不適合超大量影音流量

## 16. 第一階段開發目標

第一階段只做最小可跑版本：

- 建立靜態 WebAR 頁
- 支援一張 target
- 掃描後顯示 2D 圖片
- 掃描後顯示 GLB 模型
- 掃描後播放 MP4 影片
- 製作 fallback 頁
- 部署到 GitHub Pages
- Android Chrome 與 iOS Safari 實機測試

## 17. 目前實作狀態

已完成第一階段前端骨架：

- `index.html`：靜態入口
- `src/index.html`：Vite 開發與建置入口
- `src/main.ts`：應用啟動
- `src/ui/WebArApp.ts`：掃描 / 預覽介面與互動狀態
- `src/ui/FallbackPreview.ts`：fallback 內容預覽
- `src/ar/MindArSession.ts`：MindAR + Three.js 掃描工作階段
- `src/vendor/mindar/*`：MindAR Three ESM runtime，隨 Vite build 一起打包，避免手機瀏覽器以傳統 script 載入 module 後缺少 `MindARThree`
- `src/config/exhibits.ts`：展區 target 與素材設定
- `src/types/exhibit.ts`：展區資料型別
- `public/assets/images/*.svg`：demo 佔位圖
- `public/.nojekyll`：GitHub Pages 不使用 Jekyll 處理靜態產物
- `public/targets/README.md`：`.mind` 放置說明
- `public/assets/models/README.md`：`.glb` 放置說明
- `public/assets/videos/README.md`：`.mp4` 放置說明
- `.github/workflows/deploy-pages.yml`：建置並同步 `gh-pages` 分支

目前已放入的 target 素材：

- `public/targets/source/*.{jpg,png,webp}`
- `public/targets/demo-image.mind`

目前尚待替換的正式素材：

- `public/targets/demo-model.mind`
- `public/targets/demo-video.mind`
- `public/assets/models/demo.glb`
- `public/assets/videos/demo.mp4`

第一輪手機驗收前，必須先補齊 `.mind`、`.glb`、`.mp4` 並更新 `src/config/exhibits.ts`。

## 18. 手機相機啟動條件

相機啟動前需通過以下檢查：

- 頁面必須位於 secure context：HTTPS 或 localhost
- 瀏覽器必須支援 `navigator.mediaDevices.getUserMedia`
- 使用者需授權相機
- 選定 exhibit 的 `.mind` target 檔必須可被 fetch 到

若 `.mind` target 檔不存在，介面會顯示「找不到 target 檔」，避免使用者誤以為是手機相機壞掉。

## 19. Target 圖與 `.mind` 編譯流程

原始 target 圖放置於：

```text
public/targets/source/
```

編譯後 `.mind` 放置於：

```text
public/targets/
```

編譯流程：

1. 將 JPG / PNG / WebP target 圖放入 `public/targets/source/`
2. 使用 MindAR Image Targets Compiler 編譯
3. 下載 `targets.mind`
4. 依展區重新命名，例如 `demo-image.mind`
5. 放入 `public/targets/`
6. 更新 `src/config/exhibits.ts`

注意：`.mind` 與印刷 target 圖必須版本一致。target 圖只要裁切、壓縮、改色、加字或重新輸出，就需要重新編譯 `.mind`。

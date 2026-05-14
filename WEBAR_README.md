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
- MindAR Three runtime 以 ESM 形式放在 `src/vendor/mindar/`，由 Vite 打包，避免手機瀏覽器把 CDN module 當傳統 script 載入失敗
- `model-viewer` fallback 預覽
- 展區 target / 素材設定檔
- 手機優先的掃描與預覽介面
- GitHub Pages 相容的相對路徑設定

主要入口：

```text
src/index.html
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
- 部署方式：根目錄保留可直接服務的靜態 build；GitHub Actions 另同步 `gh-pages` 分支
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
2. 開場畫面顯示展場主題標語「開始進行除錯...」，並套用偶發性故障視覺：RGB 錯位、水平撕裂與色碼雜訊會錯開出現
3. 使用者點擊標語
4. 瀏覽器直接請求相機權限
5. 對準展場圖標
6. 掃描成功後自動顯示對應 AR 內容

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
public/targets/source/*.{jpg,png,webp}
public/targets/*.mind
public/assets/models/*.glb
public/assets/videos/*.mp4
src/config/exhibits.ts
```

若 target 圖像更換，必須重新編譯 `.mind`，否則掃描會失敗。

多個素材要自動判斷時，需把多張 target 圖一起編譯成同一個 `.mind` target set，並在 `src/config/exhibits.ts` 以不同 `markerIndex` 對應不同素材。使用者不需要選單，掃到哪個 target 就會自動顯示哪個素材。

## `.mind` 產生方式

`.mind` 是 MindAR 對 target 圖像做特徵點編譯後產生的檔案，不是直接把 JPG / PNG 改副檔名。

操作流程：

1. 將原始 target 圖放到 `public/targets/source/`
2. 打開 MindAR Image Targets Compiler
3. 把圖片拖進 compiler
4. 點擊 `Start`
5. 確認 feature points 分布足夠且平均
6. 點擊 `Download` 取得 `targets.mind`
7. 依展區改名，例如 `demo-image.mind`
8. 放到 `public/targets/`
9. 確認 `src/config/exhibits.ts` 的 `target` 欄位對到該檔案

目前程式預設會找：

```text
public/targets/demo-image.mind
public/targets/demo-model.mind
public/targets/demo-video.mind
```

## 手機相機排錯

若手機可開啟網站但相機不啟動，優先檢查：

- 網址必須是 `https://hwudigidev-creator.github.io/web-xr-111/`
- 瀏覽器需允許此網站使用相機
- iOS 請用 Safari，Android 請用 Chrome
- `public/targets/*.mind` 必須實際存在，不可只有 README
- `src/config/exhibits.ts` 的 `target` 路徑必須對到已上傳的 `.mind`
- 若出現 `IMAGE.MindARThree is unavailable`，代表 runtime 載入方式或打包版本有問題，需確認 `src/vendor/mindar/` 已被建置進最新 GitHub Pages 產物

目前已使用 `public/targets/source/Target.png` 編譯出 `public/targets/demo-image.mind`，手機預設掃描展區 A 圖像。
展區 A 目前綁定 `public/assets/models/LinTeaBuilding.glb`，掃描目前這包 `.mind` 的 marker 0 會顯示正式模型。
模型會以 target 圖面中心為底部對齊點，依 `width` / `height` 自動縮放到圖像範圍內，並沿著 target 圖面法線向上顯示。

掃描畫面提供「截圖」與「分享」按鈕。支援 Web Share 的手機會開啟原生分享，不支援時會下載 PNG 截圖。
截圖合成會先畫相機背景，再疊上 AR WebGL canvas；MindAR renderer 已開啟 `preserveDrawingBuffer`，避免截圖缺少模型。
追蹤濾波已調成較即時的除錯模式，降低模型跟隨 target 時的延遲。首頁等待畫面使用偶發性故障視覺，RGB 錯位、水平撕裂與色碼雜訊會以低頻率錯開出現；掃描畫面另有較輕的故障風格 overlay，讓現場視覺更貼近「開始進行除錯...」主題。

目前 marker 0 對應正式模型 `assets/models/LinTeaBuilding.glb`。模型已壓縮到約 7.9MB，並同步放在 `public/assets/models/` 與根目錄輸出用的 `assets/models/`。
此模型使用 `KHR_draco_mesh_compression`，專案已在 `public/draco/` 放入 three.js Draco decoder，`GLTFLoader` 載入模型時會自動使用。
AR 啟動順序為先啟動 MindAR 相機與掃描，再背景載入 3D 模型，避免模型解壓時讓手機停在黑畫面。若模型或 decoder 載入失敗，鏡頭與掃描仍會維持啟動，錯誤會顯示在底部狀態列。

網站已加入 PWA manifest 與 service worker，可安裝到手機主畫面。PWA icon 使用黑底白字 `ERROR`。Android Chrome 若判定可安裝，首頁右上會出現 `安裝 ERROR`；iOS Safari 不會觸發瀏覽器安裝事件，需用分享選單加入主畫面。

目前模型光感使用三層設定：

- ACES tone mapping 與曝光，避免模型過暗或過曝
- HemisphereLight + DirectionalLight 作為穩定展場補光
- Three.js `RoomEnvironment` 產生環境反射，支援 PBR / 金屬 / 亮面材質

每個 exhibit 可在 `src/config/exhibits.ts` 另行設定 `exposure`、`ambientIntensity`、`keyLightIntensity`、`environmentIntensity`，方便不同模型微調。

展區 B / C 仍是預留示範項目，正式的 `.mind`、`.glb`、`.mp4` 尚未放入前，介面會停用這兩個項目，避免誤判成相機或路徑錯誤。

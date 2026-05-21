# Changelog

本檔記錄此專案的版本變更。版本號規則依 `~/.claude/CLAUDE.md`：
`v0.X.0` 主要里程碑、`v0.X.Ya` 功能迭代、`v0.X.Yb` 修復優化、`v1.0.0` 正式發布。

格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)。

---

## [v0.3.0-20260522a] - 2026-05-22

### Changed
- **SET5 從 3D 模型改為 image overlay**：顯示 `assets/images/SET5-P.png`（1024×1536，2:3 直立）。
  - `type: 'model'` → `type: 'image'`，`asset` 改指 SET5-P.png。
  - `width: 0.667, height: 1`：採圖片原比，置中於 SET5 target（1×1 正方），左右留 SET5 原始 target 可見區。要填滿改回 `1×1`（會被拉成正方）。
  - 不需 `orientation` / `offset*`：image plane 預設就跟 anchor 平面對齊朝向相機，upright 與 floor target 都自然顯示。
  - 原 `assets/models/SET5.glb` / `public/assets/models/SET5.glb` 仍保留（沒被引用，未來想切回 3D 直接改 type 即可）。

### Internal
- bump `APP_VERSION` → `v0.3.0-20260522a`（跨日重啟字母序）。

---

## [v0.3.0-20260521e] - 2026-05-21

### Added
- **ERROR + LogoAR 兩個展板，共用 ERROR_V1 模型**。
  - `public/targets/source/ERROR.png`（33 KB）、`LogoAR.png`（1.37 MB）兩張新 target 圖加入 `sets.mind`（markerIndex 6、7）。
  - `assets/models/ERROR_V1.glb` raw 43 MB → 壓縮後 `public/assets/models/ERROR_V1.glb` 1.87 MB（-96%）。
  - exhibits.ts 新增兩條 `error-img`、`logo-ar`，都指向同一個 ERROR_V1.glb。
  - **`scale: 2.0`**：刻意讓模型「2× 大於 target」、可超出展板邊界。屬於設計意圖（vs SET1-5 的 0.9 收在框內）。
- `scripts/compile-mind.mjs` 的 `INPUT_ORDER` append `ERROR.png` 與 `LogoAR.png`，重編 `sets.mind`（8 markers）。

### Internal
- bump `APP_VERSION` → `v0.3.0-20260521e`。

---

## [v0.3.0-20260521d] - 2026-05-21

### Added
- **LinTea Building 重新上線**，作為 `sets.mind` 的第 6 個 marker（markerIndex 5）。
  - `public/targets/source/Target.png` 改名為 `LinTea.png`，並合進 `sets.mind`（從 3.4 MB → 4.67 MB）。
  - exhibits.ts 的 LinTea 條目 `target` 改指 `sets.mind`、`markerIndex: 5`、`orientation: 'floor'`（平面桌卡，保留 LinTea 原本 lighting）、`isAssetReady: true`。
  - 與 SET1-5（直立展板，`orientation: 'upright'`）並存於同一 `.mind` 檔；MindArSession 的 `assertSingleTargetSet` 不再阻擋。

### Changed
- `scripts/compile-mind.mjs` 改用顯式 `INPUT_ORDER` 陣列定義 markerIndex 對應，取代之前的「檔名 sort 排序」。新增 target 時直接 append 到陣列尾端即可，避免插入中間打亂既有 markerIndex 對映。

### Removed
- `public/targets/demo-image.mind` — 自 v0.2.0 起再沒被任何 active exhibit 引用，刪除以省 repo size。

### Internal
- bump `APP_VERSION` → `v0.3.0-20260521d`。

---

## [v0.3.0-20260521c] - 2026-05-21

### Changed
- **SET1 隨機變體改為「每次掃描」重抽**（原本是 module load 才抽一次）。
  - `MindArSession.createContent` 重構：`assetVariants.length > 1` 時平行載入所有 variants（共用同一個 DRACOLoader），各自建好 pivot 後包進一個容器 Group、全部 `visible: false`。
  - `handleTargetFound` 每次 target 被偵測時 `Math.random()` 挑一個 variant 顯示、其餘隱藏。
  - 進度回報聚合：用 `Map<assetPath, {loaded,total}>` 累加各 chunk，回報「總合 loaded / 總合 total」給 UI 看單一進度條。
  - 額外 bandwidth 成本：SET1 從進場下載 1.5 MB → 3 MB（雙模型共 3 MB）。
- `verifyAssetFile` 配合更新：有 `assetVariants` 時逐一 HEAD 驗證，避免「主檔在但變體 404」被延後到 createContent 才爆炸。
- 移除 exhibits.ts 內的 `pickVariant()`（module-load 隨機已不需要）；`SET1.asset` 改設為 `SET1_VARIANTS[0]` 作為 fallback / 主要顯示路徑。

### Internal
- `ContentItem` 介面新增 `variantObjects?: Object3D[]`。
- bump `APP_VERSION` → `v0.3.0-20260521c`（同 sw `error-ar-v8` 不動，因為這次無需破 SW core_assets cache，只是模型 asset 變化已被 `?v=` 機制涵蓋）。

---

## [v0.3.0-20260521b] - 2026-05-21

### Added
- `public/targets/sets.mind`（3.4 MB），SET1–SET5 五個 marker 編譯結果。
- `scripts/compile-mind.mjs` + `npm run compile:mind`：用 Playwright 自動跑 MindAR 官方 web compiler。發現 Playwright 預設下的 `chromium_headless_shell` 跑不了 TFjs worker（卡 0%）；直接指 Playwright 完整 chromium 則被 Windows SmartScreen 擋（spawn UNKNOWN，binary 沒簽署）。最終走 `channel: 'msedge'` 用系統 Edge（同 chromium 引擎、有簽署）跑 headed，編譯 + 下載 < 1 分鐘自動完成。
- `playwright` 進 devDependencies；`compile:mind` 入口腳本。

### Fixed
- 上一版 deploy「無法啟動 AR：找不到 target 檔：targets/sets.mind」根因解決 — 該 .mind 檔正式入 repo。

---

## [v0.3.0-20260521a] - 2026-05-21

主要里程碑：SET 系列 5 個展板上線（含 SET1 的兩個隨機變體）。新增直立展板（upright）擺放模式。

### Added
- **SET1–SET5 五個 exhibit**（`src/config/exhibits.ts`）：全部使用同一個 `targets/sets.mind`，markerIndex 0..4 對應。模型尺度約 1.9 m 直立人形，全部 `orientation: 'upright'`、`scale: 0.9`。
- **SET1 隨機變體**：頁面載入時從 `SET1-1.glb` / `SET1-2.glb` 抽一個顯示，同 session 維持一致，重整才會重抽。`ModelExhibit.assetVariants` 是抽選來源；最終選中的 path 落在 `asset` 欄位。
- **新型別 `ExhibitOrientation = 'floor' | 'upright'`**（`src/types/exhibit.ts`）：
  - `floor`（向下相容、預設）：target 平躺地面，模型套用 `pivot.rotation.x = π/2` 立起來
  - `upright`：target 直立掛牆，Y-up 模型不旋轉、三軸置中於 target 中心
- `ModelExhibit` 加入 `offsetX/offsetY/offsetZ`，可把模型推離 target（upright 模式特別需要往 +Z 推開展板）。
- **`scripts/optimize-models.mjs`**：批次壓縮 `assets/models/*.glb` → `public/assets/models/*.glb`。`Demo.glb` 直接複製不壓縮。`npm run optimize:models` 入口改指到這個腳本。
- 6 個 SET 系列 raw GLB（SET1-1 / SET1-2 / SET2 / SET3 / SET4 / SET5，共 134 MB）→ 壓縮後 8.4 MB（94% 縮減）部署到 `public/assets/models/`。

### Changed
- `MindArSession.createContent`：依 `orientation` 切換 fitScale 公式與置中策略；直立模式不旋轉、三軸置中；最後一律以 `pivot.position` 套用 `offsetX/Y/Z`。
- `LinTea Building` 暫設 `isAssetReady: false`：它的 target 用獨立 `demo-image.mind`，與 SET 系列的 `sets.mind` 不相容（MindArSession 要求所有 active exhibits 共用同一 .mind 檔）；要恢復需把它一起合進新 `.mind` set。
- `APP_VERSION` 升至 `v0.3.0-20260521a`，service worker `CACHE_NAME` 升至 `error-ar-v8`。

### Known Issues
- **`public/targets/sets.mind` 尚未產出**。需要把 `public/targets/source/SET1.jpg`..`SET5.jpg` 依序餵給 [MindAR Image Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile)，下載產出後放到 `public/targets/sets.mind`。在這個檔到位之前，啟動 AR 會在「檢查素材中」階段顯示「找不到 target 檔」。
- Compiler CLI 不存在 npm（曾嘗試 `mind-ar-js-cli` 不存在），mind-ar 自身的 `Compiler` 是 browser-only（依賴 worker + DOM canvas），node 跑不起來。目前以官方 web 工具補完。

---

## [v0.2.0-20260521a] - 2026-05-21

建立 raw → optimized → deploy 的模型壓縮工作流，將最新 LinTea raw（112 MB）壓到 3.5 MB 部署。

### Added
- `npm run optimize:models` 壓縮腳本：呼叫 `@gltf-transform/cli optimize`（Draco + WebP + dedup/instance/weld/simplify/prune）。
- `assets/models/README.md` 文件化「raw → optimized → deploy」工作流。

### Changed
- 更新 LinTeaBuilding.glb：使用者於 `assets/models/` 放入最新 raw 版本（112 MB、PNG 紋理、無 Draco）。經新壓縮流程壓到 3.5 MB（97% 縮減）後覆蓋 `public/assets/models/` 部署版本。
- 部署用模型統一放 `public/assets/models/`；`assets/models/` 改作 raw source 區。
- `APP_VERSION` 升至 `v0.2.0-20260521a`，service worker `CACHE_NAME` 升至 `error-ar-v7`。

### Removed
- 從 git 移除 `assets/models/*.glb`（除 `Demo.glb` 外）— raw 源檔太大不入庫（GitHub 單檔 100 MB 上限），由 `.gitignore` 排除。

### Internal
- `package.json` devDeps 加入 `@gltf-transform/cli ^4.3.0`。

---

## [v0.2.0-20260519a] - 2026-05-19

資產更新：LinTea Building 模型重製，採用 Blender Principled BSDF + glTF 內嵌貼圖（PBR 完整）。

### Changed
- `public/assets/models/LinTeaBuilding.glb` 更新（15 MB → 42 MB），帶完整 PBR 材質與貼圖
- `APP_VERSION` 升至 `v0.2.0-20260519a`，service worker `CACHE_NAME` 升至 `error-ar-v6`（強制刷新舊模型快取）

---

## [v0.2.0-20260515a] - 2026-05-15

UI / UX 主要里程碑：首頁加入 ERROR LOGO、掃描頁簡化為單一錯誤回報按鈕、修復多個關鍵互動 bug。

### Added
- 首頁中央顯示 ERROR LOGO（`clamp(280px, 72vw, 520px)`），下方為細體標語「開始進行除錯...」；LOGO 與標語各自獨立計時的故障動畫（質數倍週期，抖動不同框）
- 掃描頁左上角同排顯示 70% 透明 ERROR LOGO（`pointer-events: none`，不接收觸控）
- 「錯誤回報 ▶」按鈕觸發 `navigator.share({ files })`，使用者可在系統分享單選「儲存到照片 / Save to Photos」直寫入 iOS / Android 相簿，或直接傳送給負責人

### Changed
- 截圖與分享兩顆按鈕合併為單一「錯誤回報 ▶」紅字按鈕（`#ff174d`）；箭頭以 CSS border 三角形繪製(跨字型穩定)、0.6s 紅白硬切閃爍
- 分享單 title 為「錯誤回報」、text 為 `> ERROR 回報`
- `APP_VERSION` 升至 `v0.2.0-20260515a`，service worker `CACHE_NAME` 升至 `error-ar-v5`

### Fixed
- 掃描頁按鈕第一次點擊後無法再點擊。根因：MindAR 預設會把 `.mindar-ui-overlay`（loading / scanning / error）append 到 `<body>`、`z-index: 2`、預設接收 pointer；而 `.glitch-layer` 的 `mix-blend-mode: screen` 靜默地把 `.debug-scanner` 升成 stacking context，導致按鈕 `z-index: 25` 只在內部有效，從外部看 debug-scanner 是 z=auto 的單一層、被 MindAR scanning mask 整片蓋住。修法：建構 MindARThree 時關閉那三個 overlay（`uiLoading/uiScanning/uiError: 'no'`），並對 `.debug-scanner` 設定 `z-index: 100 + isolation: isolate` 做雙保險
- target 重新偵測後模型不再出現。根因：`onLost: 'hide'` 把 `item.object.visible = false`，但 `handleTargetFound` 只重設外層 `contentGroup.visible`，內層 mesh 仍是隱藏。修法：`handleTargetFound` 開頭補回 `item.object.visible = true`
- 截圖按鈕原本只產生 blob 沒觸發實際下載；新流程確保 share 或 download 必有其一輸出
- iOS Safari 在分享單關閉後留下按鈕焦點，導致下次點擊被吃。修法：點擊當下 `event.currentTarget.blur()` + share 的 `finally` 區塊再清一次 `document.activeElement`
- LinTea 模型放大後 `recenter offset` 沒跟著 `fitScale` 縮放，導致模型被推出視野（v0.1.0-20260515e 已修，本版同步保留）

---

## [v0.1.0-20260515f] - 2026-05-15

### Fixed
- 模型載入完成後 GLTFLoader 拋 `Cannot read properties of undefined (reading 'extensions')`。原因：新版 GLB 的 `meshes[370]` 與 `meshes[371]`（名為 `__safeglb_temp_1F 石柱4`、`__safeglb_temp_石柱1`）的 primitive 引用了 `material: 57`，但 `materials` 陣列只有 0..56（共 57 個），導致存取 `materials[57].extensions` 時讀到 undefined。已 patch GLB 將該兩處 material 索引改為 56（`石柱1.001`，名稱最接近的同類材質）。

### Known Issues
- 上述 patch 是繞過匯出工具的 bug（mesh 名稱前綴 `__safeglb_temp_` 暗示某個 GLB 後處理工具索引算錯）。下次匯出建議檢查／更新該工具，或在 Blender 端把孤立的石柱 mesh 合併到正式 material slot。

---

## [v0.1.0-20260515e] - 2026-05-15

### Fixed
- AR 偵測到 target 後看不到模型。原因：`MindArSession.createContent` 對模型做置中位移時，`model.position` 使用未縮放的 bounding box 偏移量，而後續才 `setScalar(fitScale)` 將幾何縮小至約 1/775。位移量因未跟著被縮，導致模型被推到約 0.18 單位以外的位置（對 LinTea 來說 Z 中心是 -142，縮放後位移依舊 +142）。改成先 `setScalar`、再以 `-center * fitScale` 設定位移。Demo.glb 之前沒事是因為其 bounds 接近原點，offset 量級接近 0。

---

## [v0.1.0-20260515d] - 2026-05-15

### Added
- 模型下載進度顯示。GLTFLoader 改用 `loader.load` + `onProgress` 把 byte 進度往上吐，UI 在 `scanning` 階段顯示 `${exhibit.name} XX% / YY MB`，下載完成後自動切回「掃描中」。
- 新增 `MindArSessionCallbacks.onContentProgress` 與 `onContentLoaded` 兩個回呼。

---

## [v0.1.0-20260515c] - 2026-05-15

### Changed
- 替換 LinTea Building 為重新乾淨匯出的 GLB（紋理由 webp 改為 jpeg，檔案 7.9 MB → 15 MB；mesh 仍維持 Draco 壓縮）。textures[12] 的 patch 不再需要，模型本身已自洽。
- 同步移除上一版 Known Issues。

---

## [v0.1.0-20260515b] - 2026-05-15

### Fixed
- 部署後使用者仍看到 LinTea 模型載入失敗，根因是 GitHub Pages 對 `.glb` 仍走 10 分鐘 HTTP cache + service worker 殘留舊版資源。將 `APP_VERSION` 集中到 `src/config/version.ts`，並在 `resolvePublicPath` 對非 Draco decoder 路徑自動掛上 `?v=${APP_VERSION}` 作 cache busting。Service worker `CACHE_NAME` 同步從 `error-ar-v3` 升到 `error-ar-v4` 以汰換舊快取。

---

## [v0.1.0-20260515a] - 2026-05-15

當前線上 build 標籤，部署於 GitHub Pages（`hwudigidev-creator/web-xr-111`）。

### Added
- PWA 支援與 Draco 壓縮模型載入（`d4ed69a`）
- 壓縮版 LinTea Building 模型納入專案（`a6d9e1b`），並設定為當前 target 對應素材（`7b9ca9e`）
- 啟動畫面顯示 build version label（`1d98241`）
- 開場除錯故障動畫強化（`6daeaf1`）

### Fixed
- LinTeaBuilding.glb 內 `textures[12]` 缺少 `EXT_texture_webp.source`，導致 GLTFLoader 拋 `Cannot read properties of undefined (reading 'uri')`。已將該 texture 指向 `images[0]` 作為佔位 image（`d19c440`）
- 補上 GLTF Draco WASM decoder，避免壓縮模型無法解碼（`bd74f0e`）
- 模型載入期間保持相機畫面不中斷（`4135e5d`）
- 模型載入前先啟動相機，避免黑屏（`48b8865`）
- 加快標題故障動畫時序（`a76bf15`）
- 修正 debug start glitch 疊圖位置（`26cbcaa`）

### CI
- 還原 GitHub Pages 部署 workflow、`package-lock.json` 與 build 用源碼（`208f858` / `46578f3` / `b482baa`）

### Known Issues
- LinTeaBuilding.glb 的 `materials[27]`（屋頂1.1001）目前貼到「屋頂邊緣」這張 webp 紋理當佔位，視覺正確性未保證；正本清源需回 Blender 重新匯出乾淨的 GLB。（v0.1.0-20260515c 已解決）

---

## [v0.1.0-init] - 2026-05-14

WebAR 展覽 MVP 初版骨架，含 GitHub Pages 部署流程。

### Added
- WebAR exhibition MVP（`b04e1f5`）：MindAR + Three.js 影像追蹤展示
- 自動偵測就緒 AR 素材（`e625e7b`）
- 簡化 AR debug 進入流程（`b11bcfd`）
- 在當前 target 上顯示測試模型（`efa230a`）
- 改善 AR 截圖與模型 fit 邏輯（`11bd93a`）
- 加入 glitch scan 效果（`7ed51f6`）
- 模型光照調整（`c6e9771`）

### Fixed
- 截圖時納入 AR canvas 圖層（`e3c668d`）
- 補上編譯後的 MindAR target 檔（`6934fac`）
- 為 Pages 部署 bundle MindAR runtime（`345f435`）

### CI
- GitHub Pages 輸出設定初版（`3be2fbf`）
- 支援 main-root Pages 部署模式（`e9c4d08`）

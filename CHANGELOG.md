# Changelog

本檔記錄此專案的版本變更。版本號規則依 `~/.claude/CLAUDE.md`：
`v0.X.0` 主要里程碑、`v0.X.Ya` 功能迭代、`v0.X.Yb` 修復優化、`v1.0.0` 正式發布。

格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)。

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
- 截圖與分享兩顆按鈕合併為單一「錯誤回報 ▶」紅字按鈕（`#ff174d`）；箭頭以 CSS border 三角形繪製（跨字型穩定）、0.6s 紅白硬切閃爍
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

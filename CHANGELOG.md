# Changelog

本檔記錄此專案的版本變更。版本號規則依 `~/.claude/CLAUDE.md`：
`v0.X.0` 主要里程碑、`v0.X.Ya` 功能迭代、`v0.X.Yb` 修復優化、`v1.0.0` 正式發布。

格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)。

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

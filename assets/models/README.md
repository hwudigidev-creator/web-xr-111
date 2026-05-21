# Models — Source (Raw)

這個資料夾放**未壓縮的模型原檔**，作為壓縮前的來源。

- 不會被 vite 打包（vite 的 `publicDir` 指到 `../public`）
- `*.glb` 已被 `.gitignore` 排除（避免大檔進 git），唯一例外是 `Demo.glb`
- 壓縮後的部署版本在 `../public/assets/models/`

## 壓縮工作流

把 raw `.glb` 放進這裡後執行：

```bash
npm run optimize:models
```

底層走 `scripts/optimize-models.mjs`：
- 對每個 `assets/models/*.glb` 跑 `@gltf-transform/cli optimize`
- 套用 Draco mesh 壓縮、PNG/JPEG → WebP 紋理、dedup / instance / weld / simplify / prune / sparse
- `Demo.glb` 直接複製不壓縮（測試用小檔）
- 輸出到對應的 `public/assets/models/*.glb`

實測壓縮比例（2026-05-21）：

| 模型 | Raw | Optimized | 壓縮率 |
|---|---:|---:|---:|
| SET1-1 | 21.3 MB | 1.54 MB | 93% |
| SET1-2 | 20.6 MB | 1.49 MB | 93% |
| SET2 | 12.7 MB | 0.68 MB | 95% |
| SET3 | 28.4 MB | 1.89 MB | 93% |
| SET4 | 38.9 MB | 1.11 MB | 97% |
| SET5 | 11.9 MB | 1.68 MB | 86% |
| LinTeaBuilding | 117.7 MB | 3.49 MB | 97% |

## 為何分兩處

| 路徑 | 角色 | 入 git？ |
|---|---|---|
| `assets/models/` | Raw source（你從 Blender 匯出的版本） | 否（`Demo.glb` 例外） |
| `public/assets/models/` | 部署版本（壓縮後） | 是 |

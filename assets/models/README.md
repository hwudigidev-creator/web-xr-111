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

底層用 `@gltf-transform/cli optimize`：
- 套用 Draco mesh 壓縮
- PNG / JPEG 紋理轉 WebP
- 同時做 dedup / instance / palette / weld / simplify / prune / sparse

實測 LinTeaBuilding.glb 從 112 MB 壓到 3.5 MB（約 97% 縮減）。

## 為何分兩處

| 路徑 | 角色 | 入 git？ |
|---|---|---|
| `assets/models/` | Raw source（你從 Blender 匯出的版本） | 否（`Demo.glb` 例外） |
| `public/assets/models/` | 部署版本（壓縮後） | 是 |

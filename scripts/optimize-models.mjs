#!/usr/bin/env node
/**
 * Batch optimizer for raw GLB models.
 *
 * 對 assets/models/*.glb（raw）逐一跑 @gltf-transform/cli `optimize` pipeline
 * （dedup / instance / weld / simplify / prune / draco / webp 等），輸出到
 * public/assets/models/*.glb（部署版）。
 *
 * 用法：`npm run optimize:models`
 *
 * 想跳過某些檔案：在 SKIP 集合加進來；或把 raw 檔從 assets/models/ 移走。
 * Demo.glb 是測試用小檔，直接 copy，不跑壓縮。
 */
import { execSync } from 'node:child_process';
import { existsSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC_DIR = 'assets/models';
const DST_DIR = 'public/assets/models';
const SKIP = new Set(['README.md']);
const COPY_AS_IS = new Set(['Demo.glb']);

const files = readdirSync(SRC_DIR)
  .filter((name) => name.endsWith('.glb') && !SKIP.has(name));

if (files.length === 0) {
  console.log('No .glb files found in', SRC_DIR);
  process.exit(0);
}

let totalRaw = 0;
let totalOut = 0;

for (const name of files) {
  const src = join(SRC_DIR, name);
  const dst = join(DST_DIR, name);
  const rawSize = statSync(src).size;
  totalRaw += rawSize;

  if (COPY_AS_IS.has(name)) {
    copyFileSync(src, dst);
    const outSize = statSync(dst).size;
    totalOut += outSize;
    console.log(`[copy]     ${name.padEnd(20)} ${(rawSize / 1024 / 1024).toFixed(2)} MB`);
    continue;
  }

  console.log(`[optimize] ${name}`);
  execSync(
    `npx gltf-transform optimize "${src}" "${dst}" --compress draco --texture-compress webp`,
    { stdio: 'inherit' }
  );

  const outSize = statSync(dst).size;
  totalOut += outSize;
  const pct = (100 * (1 - outSize / rawSize)).toFixed(1);
  console.log(`           ${name.padEnd(20)} ${(rawSize / 1024 / 1024).toFixed(2)} MB → ${(outSize / 1024 / 1024).toFixed(2)} MB (-${pct}%)`);
}

if (existsSync(SRC_DIR) && existsSync(DST_DIR)) {
  const ratio = (100 * (1 - totalOut / totalRaw)).toFixed(1);
  console.log('---');
  console.log(`Total: ${(totalRaw / 1024 / 1024).toFixed(2)} MB → ${(totalOut / 1024 / 1024).toFixed(2)} MB (-${ratio}%)`);
}

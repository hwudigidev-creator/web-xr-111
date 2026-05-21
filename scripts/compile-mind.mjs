#!/usr/bin/env node
/**
 * 用 Playwright 自動跑 MindAR 官方 web compiler，把 public/targets/source/SET*.jpg
 * 編譯成 .mind 後存到 public/targets/sets.mind。
 */
import { chromium } from 'playwright';
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// 解析路徑時以「腳本所在位置」為基準，避免 cwd 改變後找不到 public/。
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const SRC_DIR = resolve(PROJECT_ROOT, 'public/targets/source');
const OUT_PATH = resolve(PROJECT_ROOT, 'public/targets/sets.mind');
const TMP_DIR = resolve(PROJECT_ROOT, 'scripts/.tmp');
const COMPILER_URL = 'https://hiukim.github.io/mind-ar-js-doc/tools/compile';

// markerIndex 對應「在這個陣列裡的位置」。順序就是 markerIndex 0、1、2、...
// 新增 target 時：把檔名加在最後（不要插中間，會打亂既有 exhibits 的 markerIndex）。
const INPUT_ORDER = [
  'SET1.jpg',
  'SET2.jpg',
  'SET3.jpg',
  'SET4.jpg',
  'SET5.jpg',
  'LinTea.png', // markerIndex 5 — LinTea Building 平面桌卡
  'ERROR.png',  // markerIndex 6 — ERROR_V1 模型（直立、模型 2× 大於圖）
  'LogoAR.png'  // markerIndex 7 — ERROR_V1 模型（同上）
];

const inputs = INPUT_ORDER.map((name) => join(SRC_DIR, name));
const missing = inputs.filter((p) => !readdirSync(SRC_DIR).includes(p.split(/[\\/]/).pop() ?? ''));
if (missing.length > 0) {
  console.error('Missing target source files:');
  missing.forEach((p) => console.error('  -', p));
  process.exit(1);
}

console.log('Inputs (in marker order):');
inputs.forEach((p, i) => console.log(`  [${i}] ${p}`));

// MindAR compiler 用 TensorFlow.js + WebGL；Playwright 預設下載的 chromium
// 沒簽署、會被 Windows SmartScreen 擋（spawn UNKNOWN）。改用系統內已安裝、
// 簽署過的 Microsoft Edge（同樣 Chromium 引擎）。
const browser = await chromium.launch({
  channel: 'msedge',
  headless: false,
  args: [
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows'
  ]
});
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();

page.on('console', (msg) => {
  const t = msg.text();
  if (msg.type() === 'error') console.log('[browser err]', t);
  else if (/progress|process|extracted|features|compile|done|complete|saved/i.test(t)) {
    console.log('[browser]', t);
  }
});

console.log('Opening MindAR compiler…');
await page.goto(COMPILER_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 30_000 });
await page.locator('input[type="file"]').setInputFiles(inputs);
console.log(`Uploaded ${inputs.length} image(s).`);

// 先用一張截圖看 UI 結構
mkdirSync(TMP_DIR, { recursive: true });
await page.screenshot({ path: resolve(TMP_DIR, '01-after-upload.png'), fullPage: true });

const startButton = page.getByRole('button', { name: /start/i }).first();
await startButton.waitFor({ timeout: 15_000 });
await startButton.click();
console.log('Clicked Start. Listening for download or button changes…');

// 兩條路同時等：
//   1) 任何 download event 觸發（最理想）
//   2) 出現 Download 按鈕／連結（手動觸發）
let downloaded = false;
const downloadPromise = page.waitForEvent('download', { timeout: 900_000 })
  .then((dl) => ({ kind: 'download', dl }))
  .catch(() => null);

// 同時偵測 Download 按鈕
const buttonPromise = page.locator('button:has-text("Download"), a:has-text("Download")').first()
  .waitFor({ timeout: 900_000 })
  .then(() => ({ kind: 'button' }))
  .catch(() => null);

// 每 15 秒拍一張截圖看狀態，並把 "Progress: XX %" 的文字 dump 出來
const progressTimer = setInterval(async () => {
  try {
    const n = Date.now();
    await page.screenshot({ path: resolve(`scripts/.tmp/progress-${n}.png`), fullPage: false });
    // 抓 main 區塊內提到 progress 的那行
    const progressLine = await page.evaluate(() => {
      const m = (document.body.innerText.match(/Progress:?\s*\d+\s*%/i) || [])[0];
      return m || '(no progress line)';
    }).catch(() => '(eval failed)');
    console.log(`[poll ${new Date().toISOString().slice(11,19)}] ${progressLine}`);
  } catch {}
}, 15_000);

const result = await Promise.race([downloadPromise, buttonPromise]);
clearInterval(progressTimer);

if (!result) {
  console.error('No download event nor Download button surfaced within 15 min.');
  await page.screenshot({ path: resolve(TMP_DIR, 'final.png'), fullPage: true });
  await browser.close();
  process.exit(1);
}

let dl;
if (result.kind === 'download') {
  dl = result.dl;
} else {
  // 點 Download 觸發下載
  const [event] = await Promise.all([
    page.waitForEvent('download', { timeout: 60_000 }),
    page.locator('button:has-text("Download"), a:has-text("Download")').first().click()
  ]);
  dl = event;
  downloaded = true;
}

const downloadPath = await dl.path();
console.log('Got download at', downloadPath);

mkdirSync(resolve(PROJECT_ROOT, 'public/targets'), { recursive: true });
const buf = await readFile(downloadPath);
writeFileSync(OUT_PATH, buf);
console.log('Saved →', OUT_PATH, `(${buf.length} bytes)`);

await browser.close();

import type { Exhibit } from '../types/exhibit';

// assetVariants 列表會在 MindArSession 內被全部載入，
// 每次 target 被偵測到時 handleTargetFound 隨機顯示其中一個。
// asset 欄位作為 fallback / 主要顯示名稱（給只有單一變體時用）。
const SET1_VARIANTS = [
  'assets/models/SET1-1.glb',
  'assets/models/SET1-2.glb'
];

// SET 系列共用同一個 .mind 檔（5 個 marker，依 markerIndex 0..4 對應）。
// 此檔案需透過 MindAR Image Compiler（https://hiukim.github.io/mind-ar-js-doc/tools/compile）
// 將 public/targets/source/SET1.jpg..SET5.jpg 依序合併編譯，產出後放在 public/targets/sets.mind。
const SETS_TARGET = 'targets/sets.mind';

export const exhibits: Exhibit[] = [
  {
    id: 'set1',
    name: 'SET 1',
    zone: 'SET',
    target: SETS_TARGET,
    markerIndex: 0,
    type: 'model',
    asset: SET1_VARIANTS[0],
    assetVariants: SET1_VARIANTS,
    preview: 'assets/images/model-placeholder.svg',
    orientation: 'upright',
    offsetZ: 0,
    width: 1,
    height: 1,
    scale: 0.9,
    onLost: 'hide',
    isAssetReady: true
  },
  {
    id: 'set2',
    name: 'SET 2',
    zone: 'SET',
    target: SETS_TARGET,
    markerIndex: 1,
    type: 'model',
    asset: 'assets/models/SET2.glb',
    preview: 'assets/images/model-placeholder.svg',
    orientation: 'upright',
    offsetZ: 0,
    width: 1,
    height: 1,
    scale: 0.9,
    onLost: 'hide',
    isAssetReady: true
  },
  {
    id: 'set3',
    name: 'SET 3',
    zone: 'SET',
    target: SETS_TARGET,
    markerIndex: 2,
    type: 'model',
    asset: 'assets/models/SET3.glb',
    preview: 'assets/images/model-placeholder.svg',
    orientation: 'upright',
    offsetZ: 0,
    width: 1,
    height: 1,
    scale: 0.9,
    onLost: 'hide',
    isAssetReady: true
  },
  {
    id: 'set4',
    name: 'SET 4',
    zone: 'SET',
    target: SETS_TARGET,
    markerIndex: 3,
    type: 'model',
    asset: 'assets/models/SET4.glb',
    preview: 'assets/images/model-placeholder.svg',
    orientation: 'upright',
    offsetZ: 0,
    width: 1,
    height: 1,
    scale: 0.9,
    onLost: 'hide',
    isAssetReady: true
  },
  {
    id: 'set5',
    name: 'SET 5',
    zone: 'SET',
    target: SETS_TARGET,
    markerIndex: 4,
    // SET5 改成顯示一張圖片（SET5-P.png，1024×1536，2:3 直立）：
    // 平面貼在 target 上（image 預設 plane 已經跟 anchor 對齊朝向相機，不需 orientation/offset）。
    type: 'image',
    asset: 'assets/images/SET5-P.png',
    preview: 'assets/images/video-placeholder.svg',
    // width/height 採圖片原比（2:3）置中於 target；不縮放、不填滿，
    // 左右兩側留一點原 target 的可見區域。要填滿改 width: 1, height: 1。
    width: 0.667,
    height: 1,
    onLost: 'hide',
    isAssetReady: true
  },
  // ERROR.png 與 LogoAR.png 共用同一個 ERROR_V1 模型。
  // 直立展板，但模型故意超出 target 範圍（scale: 2.0，模型約 2× 高於 target image）。
  {
    id: 'error-img',
    name: 'ERROR',
    zone: 'ERROR',
    target: SETS_TARGET,
    markerIndex: 6,
    type: 'model',
    asset: 'assets/models/ERROR_V1.glb',
    preview: 'assets/images/model-placeholder.svg',
    orientation: 'upright',
    width: 1,
    height: 1,
    scale: 2.0,
    onLost: 'hide',
    isAssetReady: true
  },
  {
    id: 'logo-ar',
    name: 'LogoAR',
    zone: 'ERROR',
    target: SETS_TARGET,
    markerIndex: 7,
    type: 'model',
    asset: 'assets/models/ERROR_V1.glb',
    preview: 'assets/images/model-placeholder.svg',
    orientation: 'upright',
    width: 1,
    height: 1,
    scale: 2.0,
    onLost: 'hide',
    isAssetReady: true
  },
  {
    id: 'lintea-building',
    name: 'LinTea Building',
    zone: 'A',
    // 與 SET1-5 共用 sets.mind；markerIndex 5 對應 LinTea.png（compile-mind.mjs 的 INPUT_ORDER 最後一筆）。
    target: SETS_TARGET,
    markerIndex: 5,
    type: 'model',
    asset: 'assets/models/LinTeaBuilding.glb',
    preview: 'assets/images/model-placeholder.svg',
    // floor orientation：LinTea 是平面桌卡 target，模型套 pivot.rotation.x = π/2 立起來。
    orientation: 'floor',
    width: 1,
    height: 0.5625,
    scale: 0.9,
    exposure: 1.15,
    ambientIntensity: 1.15,
    keyLightIntensity: 2.35,
    environmentIntensity: 1,
    onLost: 'hide',
    isAssetReady: true
  },
  {
    id: 'demo-model',
    name: '展區 B 模型',
    zone: 'B',
    target: 'targets/demo-model.mind',
    markerIndex: 0,
    type: 'model',
    asset: 'assets/models/demo.glb',
    preview: 'assets/images/model-placeholder.svg',
    scale: 0.42,
    onLost: 'hide',
    isAssetReady: false
  },
  {
    id: 'demo-video',
    name: '展區 C 影片',
    zone: 'C',
    target: 'targets/demo-video.mind',
    markerIndex: 0,
    type: 'video',
    asset: 'assets/videos/demo.mp4',
    preview: 'assets/images/video-placeholder.svg',
    width: 1,
    height: 0.5625,
    autoplay: true,
    muted: true,
    loop: true,
    onLost: 'pause',
    isAssetReady: false
  }
];

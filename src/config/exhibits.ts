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
    type: 'model',
    asset: 'assets/models/SET5.glb',
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
    id: 'demo-model-on-current-target',
    name: 'LinTea Building',
    zone: 'A',
    target: 'targets/demo-image.mind',
    markerIndex: 0,
    type: 'model',
    asset: 'assets/models/LinTeaBuilding.glb',
    preview: 'assets/images/model-placeholder.svg',
    width: 1,
    height: 0.5625,
    scale: 0.9,
    exposure: 1.15,
    ambientIntensity: 1.15,
    keyLightIntensity: 2.35,
    environmentIntensity: 1,
    onLost: 'hide',
    // 暫時關閉：此 exhibit 用獨立的 demo-image.mind，與 SET 系列的 sets.mind 不相容
    // （MindArSession 要求所有 active exhibits 共用同一個 .mind 檔）。
    isAssetReady: false
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

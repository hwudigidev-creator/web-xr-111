import type { Exhibit } from '../types/exhibit';

export const exhibits: Exhibit[] = [
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

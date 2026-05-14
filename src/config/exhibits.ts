import type { Exhibit } from '../types/exhibit';

export const exhibits: Exhibit[] = [
  {
    id: 'demo-model-on-current-target',
    name: '展區 A 模型',
    zone: 'A',
    target: 'targets/demo-image.mind',
    markerIndex: 0,
    type: 'model',
    asset: 'assets/models/Demo.glb',
    preview: 'assets/images/model-placeholder.svg',
    scale: 0.42,
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

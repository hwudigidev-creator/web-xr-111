export type ExhibitContentType = 'image' | 'model' | 'video';

export type ExhibitLostBehavior = 'hide' | 'pause' | 'keep';

export interface ExhibitBase {
  id: string;
  name: string;
  zone: string;
  target: string;
  markerIndex: number;
  type: ExhibitContentType;
  asset: string;
  preview?: string;
  width?: number;
  height?: number;
  scale?: number;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onLost: ExhibitLostBehavior;
  isAssetReady: boolean;
}

export interface ImageExhibit extends ExhibitBase {
  type: 'image';
  width: number;
  height: number;
}

export interface ModelExhibit extends ExhibitBase {
  type: 'model';
  scale: number;
}

export interface VideoExhibit extends ExhibitBase {
  type: 'video';
  width: number;
  height: number;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
}

export type Exhibit = ImageExhibit | ModelExhibit | VideoExhibit;

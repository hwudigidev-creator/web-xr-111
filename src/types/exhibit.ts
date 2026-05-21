export type ExhibitContentType = 'image' | 'model' | 'video';

export type ExhibitLostBehavior = 'hide' | 'pause' | 'keep';

/**
 * 模型相對於 target 的擺放方式：
 * - `floor`：target 平躺在地面（例如桌面圖卡）。模型套用 `rotation.x = π/2`，
 *   讓 Y-up 模型從地面長出來。
 * - `upright`：target 直立掛在牆上的展板。模型維持 Y-up，不旋轉，
 *   會出現在展板「前面」（透過 `offsetZ` 推出來）。
 */
export type ExhibitOrientation = 'floor' | 'upright';

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
  exposure?: number;
  ambientIntensity?: number;
  keyLightIntensity?: number;
  environmentIntensity?: number;
}

export interface ImageExhibit extends ExhibitBase {
  type: 'image';
  width: number;
  height: number;
}

export interface ModelExhibit extends ExhibitBase {
  type: 'model';
  scale: number;
  /** target 擺放方式；省略時視為 `floor`（向下相容舊配置）。 */
  orientation?: ExhibitOrientation;
  /** 模型相對 target 中心的偏移（pivot local 空間，公尺）。 */
  offsetX?: number;
  offsetY?: number;
  offsetZ?: number;
  /**
   * 隨機素材變體清單。若設定且非空，模組載入時會隨機挑一個覆蓋 `asset`，
   * 同一個 page session 內保持不變（重新整理頁面才會重抽）。
   */
  assetVariants?: string[];
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

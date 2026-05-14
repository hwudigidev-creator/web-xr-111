import type { Camera, Group, Scene, WebGLRenderer } from 'three';

const MINDAR_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js';

export interface MindArAnchor {
  group: Group;
  onTargetFound?: () => void;
  onTargetLost?: () => void;
}

export interface MindARThreeOptions {
  container: HTMLElement;
  imageTargetSrc: string;
  maxTrack?: number;
  filterMinCF?: number;
  filterBeta?: number;
}

export interface MindARThreeInstance {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: Camera;
  addAnchor(markerIndex: number): MindArAnchor;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface MindARThreeConstructor {
  new (options: MindARThreeOptions): MindARThreeInstance;
}

interface MindARImageRuntime {
  MindARThree: MindARThreeConstructor;
}

declare global {
  interface Window {
    MINDAR?: {
      IMAGE?: MindARImageRuntime;
    };
  }
}

let loadPromise: Promise<MindARImageRuntime> | undefined;

export async function loadMindArImageRuntime(): Promise<MindARImageRuntime> {
  const runtime = window.MINDAR?.IMAGE;

  if (runtime?.MindARThree) {
    return runtime;
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = MINDAR_SCRIPT_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';

      script.addEventListener('load', () => {
        const loadedRuntime = window.MINDAR?.IMAGE;

        if (loadedRuntime?.MindARThree) {
          resolve(loadedRuntime);
          return;
        }

        reject(new Error('MindAR runtime loaded, but IMAGE.MindARThree is unavailable.'));
      });

      script.addEventListener('error', () => {
        reject(new Error(`Unable to load MindAR runtime: ${MINDAR_SCRIPT_URL}`));
      });

      document.head.append(script);
    });
  }

  return loadPromise;
}

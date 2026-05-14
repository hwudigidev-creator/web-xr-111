import type { Camera, Group, Scene, WebGLRenderer } from 'three';

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

interface MindARImageModule {
  MindARThree?: MindARThreeConstructor;
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
    loadPromise = import('../vendor/mindar/mindar-image-three.prod.js')
      .then((module: MindARImageModule) => {
        const loadedRuntime = window.MINDAR?.IMAGE;
        const MindARThree = module.MindARThree ?? loadedRuntime?.MindARThree;

        if (!MindARThree) {
          throw new Error('MindAR runtime loaded, but IMAGE.MindARThree is unavailable.');
        }

        window.MINDAR ??= {};
        window.MINDAR.IMAGE = {
          ...loadedRuntime,
          MindARThree
        };

        return window.MINDAR.IMAGE;
      })
      .catch((error: unknown) => {
        loadPromise = undefined;
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Unable to load MindAR runtime: ${message}`);
      });
  }

  return loadPromise;
}

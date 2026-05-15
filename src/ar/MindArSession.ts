import type {
  BufferGeometry,
  Material,
  Mesh,
  Object3D,
  Texture,
  WebGLRenderer
} from 'three';
import { resolvePublicPath } from '../config/paths';
import type { Exhibit } from '../types/exhibit';
import { loadMindArImageRuntime, type MindARThreeInstance, type MindArAnchor } from './loadMindAr';

export interface MindArSessionCallbacks {
  onReady: () => void;
  onFound: (exhibit: Exhibit) => void;
  onLost: (exhibit: Exhibit) => void;
  onContentError?: (exhibit: Exhibit, error: unknown) => void;
  onContentProgress?: (exhibit: Exhibit, loaded: number, total: number) => void;
  onContentLoaded?: (exhibit: Exhibit) => void;
}

interface ContentItem {
  exhibit: Exhibit;
  object: Object3D;
  videoElement?: HTMLVideoElement;
}

export class MindArSession {
  private mindarThree?: MindARThreeInstance;
  private anchors: MindArAnchor[] = [];
  private renderer?: WebGLRenderer;
  private scene?: import('three').Scene;
  private ambientLight?: import('three').HemisphereLight;
  private keyLight?: import('three').DirectionalLight;
  private contentItems: ContentItem[] = [];
  private textures: Texture[] = [];
  private environmentMap?: Texture;

  constructor(
    private readonly container: HTMLElement,
    private readonly exhibits: Exhibit[],
    private readonly callbacks: MindArSessionCallbacks
  ) {}

  async start(): Promise<void> {
    const THREE = await import('three');
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
    const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
    const { MindARThree } = await loadMindArImageRuntime();

    this.container.innerHTML = '';

    this.mindarThree = new MindARThree({
      container: this.container,
      imageTargetSrc: resolvePublicPath(this.exhibits[0].target),
      maxTrack: this.exhibits.length,
      filterMinCF: 0.08,
      filterBeta: 8,
      // 關掉 MindAR 自帶的 loading / scanning / error overlay。
      // 它們會 append 到 <body>、z-index 2 且預設接收 pointer，
      // 因為 .debug-scanner 被 mix-blend-mode 升成 stacking context，
      // 從外面看 z-index 25 的按鈕反而被這層 z=2 的 overlay 蓋住按不到。
      uiLoading: 'no',
      uiScanning: 'no',
      uiError: 'no'
    });

    const { renderer, scene, camera } = this.mindarThree;
    this.renderer = renderer;
    this.scene = scene;
    const initialLighting = this.getLighting(this.exhibits[0]);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = initialLighting.exposure;

    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x2c3432, initialLighting.ambientIntensity);
    const keyLight = new THREE.DirectionalLight(0xffffff, initialLighting.keyLightIntensity);
    keyLight.position.set(0.35, 1.4, 0.95);
    scene.add(ambientLight, keyLight);
    this.ambientLight = ambientLight;
    this.keyLight = keyLight;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.environmentMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = this.environmentMap;
    scene.environmentIntensity = initialLighting.environmentIntensity;
    pmremGenerator.dispose();

    const mindarThree = this.mindarThree;
    const pendingContent = this.exhibits.map((exhibit) => {
      const anchor = mindarThree.addAnchor(exhibit.markerIndex);
      const contentGroup = new THREE.Group();
      let contentItem: ContentItem | undefined;
      let isTargetVisible = false;

      contentGroup.visible = false;
      anchor.group.add(contentGroup);

      anchor.onTargetFound = () => {
        isTargetVisible = true;
        contentGroup.visible = contentItem !== undefined;
        this.applyLighting(exhibit);
        if (contentItem) {
          this.handleTargetFound(contentItem);
        }
        this.callbacks.onFound(exhibit);
      };

      anchor.onTargetLost = () => {
        isTargetVisible = false;
        contentGroup.visible = false;
        if (contentItem) {
          this.handleTargetLost(contentItem);
        }
        this.callbacks.onLost(exhibit);
      };

      this.anchors.push(anchor);

      return {
        exhibit,
        load: async () => {
          contentItem = await this.createContent(THREE, GLTFLoader, DRACOLoader, exhibit);
          contentGroup.add(contentItem.object);
          contentGroup.visible = isTargetVisible;
          this.contentItems.push(contentItem);
          this.callbacks.onContentLoaded?.(exhibit);

          if (isTargetVisible) {
            this.handleTargetFound(contentItem);
          }
        }
      };
    });

    await this.mindarThree.start();

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    this.callbacks.onReady();

    for (const pendingItem of pendingContent) {
      void pendingItem.load().catch((error: unknown) => {
        this.callbacks.onContentError?.(pendingItem.exhibit, error);
      });
    }
  }

  async stop(): Promise<void> {
    for (const item of this.contentItems) {
      if (item.videoElement) {
        item.videoElement.pause();
        item.videoElement.removeAttribute('src');
        item.videoElement.load();
        item.videoElement.remove();
      }
    }

    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
    }

    for (const item of this.contentItems) {
      this.disposeObject(item.object);
    }
    this.contentItems = [];

    for (const texture of this.textures) {
      texture.dispose();
    }
    this.textures = [];

    if (this.environmentMap) {
      this.environmentMap.dispose();
      this.environmentMap = undefined;
    }

    if (this.mindarThree) {
      await this.mindarThree.stop();
      this.mindarThree = undefined;
    }

    this.anchors = [];
    this.renderer = undefined;
    this.scene = undefined;
    this.ambientLight = undefined;
    this.keyLight = undefined;
    this.container.innerHTML = '';
  }

  private async createContent(
    THREE: typeof import('three'),
    GLTFLoader: typeof import('three/examples/jsm/loaders/GLTFLoader.js').GLTFLoader,
    DRACOLoader: typeof import('three/examples/jsm/loaders/DRACOLoader.js').DRACOLoader,
    exhibit: Exhibit
  ): Promise<ContentItem> {
    if (exhibit.type === 'image') {
      const texture = await new THREE.TextureLoader().loadAsync(resolvePublicPath(exhibit.asset));
      texture.colorSpace = THREE.SRGBColorSpace;
      this.textures.push(texture);

      const geometry = new THREE.PlaneGeometry(exhibit.width, exhibit.height);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });

      return {
        exhibit,
        object: new THREE.Mesh(geometry, material)
      };
    }

    if (exhibit.type === 'video') {
      const video = document.createElement('video');
      video.src = resolvePublicPath(exhibit.asset);
      video.crossOrigin = 'anonymous';
      video.muted = exhibit.muted;
      video.loop = exhibit.loop;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');

      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.textures.push(texture);

      const geometry = new THREE.PlaneGeometry(exhibit.width, exhibit.height);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        toneMapped: false
      });

      return {
        exhibit,
        object: new THREE.Mesh(geometry, material),
        videoElement: video
      };
    }

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(resolvePublicPath('draco/'));

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    let gltf: Awaited<ReturnType<typeof loader.loadAsync>>;

    try {
      gltf = await new Promise((resolve, reject) => {
        loader.load(
          resolvePublicPath(exhibit.asset),
          (result) => resolve(result),
          (event) => {
            if (event.lengthComputable) {
              this.callbacks.onContentProgress?.(exhibit, event.loaded, event.total);
            }
          },
          (error) => reject(error instanceof Error ? error : new Error('模型載入失敗'))
        );
      });
    } finally {
      dracoLoader.dispose();
    }

    const model = gltf.scene;
    const targetWidth = exhibit.width ?? 1;
    const targetHeight = exhibit.height ?? targetWidth;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const footprintWidth = Math.max(size.x, 0.0001);
    const footprintDepth = Math.max(size.z, 0.0001);
    const fitScale = Math.min(targetWidth / footprintWidth, targetHeight / footprintDepth) * exhibit.scale;
    const pivot = new THREE.Group();

    // 先縮再位移，且把位移量乘上 fitScale，否則大模型（如 LinTea）的中心偏移會把幾何推到視野外。
    model.scale.setScalar(fitScale);
    model.position.set(-center.x * fitScale, -box.min.y * fitScale, -center.z * fitScale);
    pivot.rotation.x = Math.PI / 2;
    pivot.add(model);

    return {
      exhibit,
      object: pivot
    };
  }

  private handleTargetFound(item: ContentItem): void {
    // onLost === 'hide' 會把 object.visible 設成 false，這裡要回填，
    // 否則再次掃到 target 時 contentGroup 雖然 visible，但內層 mesh 仍是隱藏。
    item.object.visible = true;

    if (item.exhibit.type === 'video' && item.exhibit.autoplay && item.videoElement) {
      void item.videoElement.play();
    }
  }

  private applyLighting(exhibit: Exhibit): void {
    const lighting = this.getLighting(exhibit);

    if (this.renderer) {
      this.renderer.toneMappingExposure = lighting.exposure;
    }

    if (this.ambientLight) {
      this.ambientLight.intensity = lighting.ambientIntensity;
    }

    if (this.keyLight) {
      this.keyLight.intensity = lighting.keyLightIntensity;
    }

    if (this.scene) {
      this.scene.environmentIntensity = lighting.environmentIntensity;
    }
  }

  private getLighting(exhibit: Exhibit): Required<Pick<
    Exhibit,
    'exposure' | 'ambientIntensity' | 'keyLightIntensity' | 'environmentIntensity'
  >> {
    return {
      exposure: exhibit.exposure ?? 1.15,
      ambientIntensity: exhibit.ambientIntensity ?? 1.15,
      keyLightIntensity: exhibit.keyLightIntensity ?? 2.35,
      environmentIntensity: exhibit.environmentIntensity ?? 1
    };
  }

  private handleTargetLost(item: ContentItem): void {
    if (item.exhibit.onLost === 'hide') {
      item.object.visible = false;
    }

    if (item.exhibit.type === 'video' && item.exhibit.onLost === 'pause') {
      item.videoElement?.pause();
    }
  }

  private disposeObject(object: Object3D): void {
    object.traverse((child) => {
      const mesh = child as Mesh<BufferGeometry, Material | Material[]>;

      if (mesh.geometry) {
        mesh.geometry.dispose();
      }

      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

        for (const material of materials) {
          material.dispose();
        }
      }
    });
  }
}

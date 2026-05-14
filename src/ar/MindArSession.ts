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
  onFound: () => void;
  onLost: () => void;
}

export class MindArSession {
  private mindarThree?: MindARThreeInstance;
  private anchor?: MindArAnchor;
  private renderer?: WebGLRenderer;
  private videoElement?: HTMLVideoElement;
  private rootObject?: Object3D;
  private textures: Texture[] = [];

  constructor(
    private readonly container: HTMLElement,
    private readonly exhibit: Exhibit,
    private readonly callbacks: MindArSessionCallbacks
  ) {}

  async start(): Promise<void> {
    const THREE = await import('three');
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const { MindARThree } = await loadMindArImageRuntime();

    this.container.innerHTML = '';

    this.mindarThree = new MindARThree({
      container: this.container,
      imageTargetSrc: resolvePublicPath(this.exhibit.target),
      maxTrack: 1,
      filterMinCF: 0.0001,
      filterBeta: 0.001
    });

    const { renderer, scene, camera } = this.mindarThree;
    this.renderer = renderer;
    this.anchor = this.mindarThree.addAnchor(this.exhibit.markerIndex);

    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x243331, 1.6);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(0.4, 1, 0.8);
    scene.add(ambientLight, keyLight);

    this.rootObject = await this.createContent(THREE, GLTFLoader);
    this.rootObject.visible = false;
    this.anchor.group.add(this.rootObject);

    this.anchor.onTargetFound = () => {
      if (this.rootObject) {
        this.rootObject.visible = true;
      }

      this.handleTargetFound();
      this.callbacks.onFound();
    };

    this.anchor.onTargetLost = () => {
      this.handleTargetLost();
      this.callbacks.onLost();
    };

    await this.mindarThree.start();

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    this.callbacks.onReady();
  }

  async stop(): Promise<void> {
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.removeAttribute('src');
      this.videoElement.load();
      this.videoElement.remove();
      this.videoElement = undefined;
    }

    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
    }

    if (this.rootObject) {
      this.disposeObject(this.rootObject);
      this.rootObject = undefined;
    }

    for (const texture of this.textures) {
      texture.dispose();
    }
    this.textures = [];

    if (this.mindarThree) {
      await this.mindarThree.stop();
      this.mindarThree = undefined;
    }

    this.anchor = undefined;
    this.renderer = undefined;
    this.container.innerHTML = '';
  }

  private async createContent(
    THREE: typeof import('three'),
    GLTFLoader: typeof import('three/examples/jsm/loaders/GLTFLoader.js').GLTFLoader
  ): Promise<Object3D> {
    if (this.exhibit.type === 'image') {
      const texture = await new THREE.TextureLoader().loadAsync(resolvePublicPath(this.exhibit.asset));
      texture.colorSpace = THREE.SRGBColorSpace;
      this.textures.push(texture);

      const geometry = new THREE.PlaneGeometry(this.exhibit.width, this.exhibit.height);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });

      return new THREE.Mesh(geometry, material);
    }

    if (this.exhibit.type === 'video') {
      const video = document.createElement('video');
      video.src = resolvePublicPath(this.exhibit.asset);
      video.crossOrigin = 'anonymous';
      video.muted = this.exhibit.muted;
      video.loop = this.exhibit.loop;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      this.videoElement = video;

      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.textures.push(texture);

      const geometry = new THREE.PlaneGeometry(this.exhibit.width, this.exhibit.height);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        toneMapped: false
      });

      return new THREE.Mesh(geometry, material);
    }

    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(resolvePublicPath(this.exhibit.asset));
    const model = gltf.scene;
    model.scale.setScalar(this.exhibit.scale);
    model.position.set(0, 0, 0);
    return model;
  }

  private handleTargetFound(): void {
    if (this.exhibit.type === 'video' && this.exhibit.autoplay && this.videoElement) {
      void this.videoElement.play();
    }
  }

  private handleTargetLost(): void {
    if (!this.rootObject) {
      return;
    }

    if (this.exhibit.onLost === 'hide') {
      this.rootObject.visible = false;
    }

    if (this.exhibit.type === 'video' && this.exhibit.onLost === 'pause') {
      this.videoElement?.pause();
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

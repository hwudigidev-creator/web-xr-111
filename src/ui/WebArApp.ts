import { MindArSession } from '../ar/MindArSession';
import { verifyAssetFile, verifyTargetFile } from '../ar/assetChecks';
import { verifyCameraAccess } from '../ar/cameraAccess';
import { exhibits } from '../config/exhibits';
import { APP_VERSION } from '../config/version';
import type { Exhibit } from '../types/exhibit';
import { escapeHtml } from './escape';

type StageState = 'idle' | 'loading' | 'scanning' | 'found' | 'lost' | 'error';

interface StageCopy {
  title: string;
  body: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

const readyExhibits = exhibits.filter((exhibit) => exhibit.isAssetReady);

export class WebArApp {
  private isStarting = false;
  private isRunning = false;
  private isPwaInstallable = false;
  private pwaInstallPrompt?: BeforeInstallPromptEvent;
  private stageState: StageState = 'idle';
  private stageCopy: StageCopy = {
    title: '開始進行除錯...',
    body: ''
  };

  constructor(private readonly root: HTMLElement) {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.pwaInstallPrompt = event as BeforeInstallPromptEvent;
      this.isPwaInstallable = true;

      if (!this.isStarting && !this.isRunning) {
        this.renderStartScreen();
      }
    });

    window.addEventListener('appinstalled', () => {
      this.pwaInstallPrompt = undefined;
      this.isPwaInstallable = false;

      if (!this.isStarting && !this.isRunning) {
        this.renderStartScreen();
      }
    });
  }

  mount(): void {
    this.renderStartScreen();
  }

  private get activeExhibits(): Exhibit[] {
    if (readyExhibits.length === 0) {
      throw new Error('尚未設定任何可用的 AR 素材。');
    }

    return readyExhibits;
  }

  private renderStartScreen(): void {
    const showInstallButton = this.isPwaInstallable && !this.isStandaloneMode();

    this.root.innerHTML = `
      <main class="debug-start">
        <div class="start-corruption" aria-hidden="true">
          <span>0xE2</span><span>0x7F</span><span>SYS_ERR</span><span>RGB_SHIFT</span>
          <span>SCAN//013</span><span>MEM_FAULT</span><span>0xC0FF</span><span>FRAME_DROP</span>
        </div>
        ${showInstallButton ? '<button class="pwa-install-button" type="button" data-install-pwa>安裝 ERROR</button>' : ''}
        <button class="debug-start-button" type="button" data-debug-start>
          <span class="debug-start-stack">
            <span class="debug-start-logo" aria-hidden="true">
              <img src="./icons/ERROR.png" alt="" />
            </span>
            <strong data-text="開始進行除錯...">開始進行除錯...</strong>
          </span>
        </button>
        <div class="debug-version" aria-label="build version">${APP_VERSION}</div>
      </main>
    `;

    this.root.querySelector<HTMLButtonElement>('[data-debug-start]')?.addEventListener('click', () => {
      void this.startDebug();
    });

    this.root.querySelector<HTMLButtonElement>('[data-install-pwa]')?.addEventListener('click', (event) => {
      event.stopPropagation();
      void this.installPwa();
    });
  }

  private renderScanner(): void {
    this.root.innerHTML = `
      <main class="debug-scanner" data-stage-state="${this.stageState}">
        <div class="debug-ar-stage" data-ar-stage></div>
        <div class="glitch-layer" aria-hidden="true"></div>
        <span class="debug-scanner-logo" aria-hidden="true">
          <img src="./icons/ERROR.png" alt="" />
        </span>
        <div class="debug-actions" aria-label="capture tools">
          <button class="debug-action-button" type="button" data-report>
            <span class="debug-action-label">錯誤回報</span>
            <span class="debug-action-arrow" aria-hidden="true"></span>
          </button>
        </div>
        <div class="debug-status" aria-live="polite">
          <strong data-stage-title>${escapeHtml(this.stageCopy.title)}</strong>
          <span data-stage-body>${escapeHtml(this.stageCopy.body)}</span>
        </div>
        <div class="debug-version" aria-label="build version">${APP_VERSION}</div>
      </main>
    `;

    this.root.querySelector<HTMLButtonElement>('[data-report]')?.addEventListener('click', (event) => {
      (event.currentTarget as HTMLElement).blur();
      void this.reportError();
    });
  }

  private async startDebug(): Promise<void> {
    if (this.isStarting || this.isRunning) {
      return;
    }

    this.isStarting = true;
    this.setStageCopy('loading', '啟動相機中', '請允許瀏覽器使用相機。', false);
    this.renderScanner();

    const stage = this.root.querySelector<HTMLElement>('[data-ar-stage]');

    if (!stage) {
      this.fail('找不到 AR 容器。');
      return;
    }

    let activeExhibits: Exhibit[];

    try {
      activeExhibits = this.activeExhibits;
    } catch (error) {
      this.fail(this.formatError(error));
      return;
    }

    try {
      await verifyCameraAccess();
      this.setStageCopy('loading', '檢查素材中', `${activeExhibits.length} 組素材`);

      for (const exhibit of activeExhibits) {
        await verifyTargetFile(exhibit);
        await verifyAssetFile(exhibit);
      }

      this.assertSingleTargetSet(activeExhibits);
      this.setStageCopy('loading', '載入 AR 中', `${activeExhibits.length} 組素材`);
    } catch (error) {
      this.fail(this.formatError(error));
      return;
    }

    const session = new MindArSession(stage, activeExhibits, {
      onReady: () => {
        this.isStarting = false;
        this.isRunning = true;
        this.setStageCopy('scanning', '掃描中', '請對準 Target 圖。');
      },
      onFound: (exhibit) => {
        this.setStageCopy('found', '已偵測素材', exhibit.name);
      },
      onLost: () => {
        this.setStageCopy('lost', 'Target 遺失', '重新對準 Target 圖。');
      },
      onContentError: (exhibit, error) => {
        this.setStageCopy('error', '素材載入失敗', `${exhibit.name}: ${this.formatError(error)}`);
      },
      onContentProgress: (exhibit, loaded, total) => {
        if (this.stageState !== 'scanning') {
          return;
        }
        const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
        const sizeMb = total > 0 ? (total / 1024 / 1024).toFixed(1) : '?';
        this.setStageCopy('scanning', '下載模型中', `${exhibit.name} ${pct}% / ${sizeMb} MB`);
      },
      onContentLoaded: () => {
        if (this.stageState !== 'scanning') {
          return;
        }
        this.setStageCopy('scanning', '掃描中', '請對準 Target 圖。');
      }
    });

    try {
      await session.start();
    } catch (error) {
      await session.stop();
      this.fail(this.formatError(error));
    }
  }

  private fail(message: string): void {
    this.isStarting = false;
    this.isRunning = false;
    this.setStageCopy('error', '無法啟動 AR', message);
  }

  private async installPwa(): Promise<void> {
    if (!this.pwaInstallPrompt) {
      return;
    }

    const prompt = this.pwaInstallPrompt;
    this.pwaInstallPrompt = undefined;
    this.isPwaInstallable = false;

    await prompt.prompt();
    await prompt.userChoice.catch(() => undefined);
    this.renderStartScreen();
  }

  private isStandaloneMode(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as NavigatorWithStandalone).standalone === true;
  }

  private async reportError(): Promise<void> {
    this.setStageCopy('scanning', '正在擷取錯誤畫面', '請稍候…');

    let blob: Blob;
    try {
      blob = await this.renderStageBlob();
    } catch (error) {
      this.setStageCopy('error', '擷取失敗', this.formatError(error));
      return;
    }

    const filename = `error-report-${Date.now()}.png`;
    const file = new File([blob], filename, { type: 'image/png' });
    const canUseShare = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

    // 系統分享單是行動裝置存到相簿（iOS Photos / Android Gallery）的唯一路徑。
    if (canUseShare) {
      try {
        await navigator.share({
          files: [file],
          title: '錯誤回報',
          text: '展場 WebAR 錯誤截圖'
        });
        this.setStageCopy('scanning', '請選「儲存到照片」或傳送', '完成後可繼續掃描。');
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          this.setStageCopy('scanning', '已取消回報', '截圖未保存。');
          return;
        }
        // 其它錯誤 → 退回下載
      } finally {
        // iOS Safari 在 share sheet 關閉後可能留下按鈕焦點，導致下一次點擊被吃掉
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // iOS Safari 需要保留 URL 一段時間才能完成下載
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    this.setStageCopy('scanning', '錯誤截圖已下載', '請至瀏覽器下載清單查看。');
  }

  private async renderStageBlob(): Promise<Blob> {
    const stage = this.root.querySelector<HTMLElement>('[data-ar-stage]');

    if (!stage) {
      throw new Error('找不到 AR 畫面。');
    }

    const bounds = stage.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const output = document.createElement('canvas');
    output.width = Math.max(1, Math.round(bounds.width * scale));
    output.height = Math.max(1, Math.round(bounds.height * scale));

    const context = output.getContext('2d');

    if (!context) {
      throw new Error('無法建立截圖。');
    }

    context.scale(scale, scale);
    context.fillStyle = '#000000';
    context.fillRect(0, 0, bounds.width, bounds.height);

    const videos = stage.querySelectorAll<HTMLVideoElement>('video');
    const canvases = stage.querySelectorAll<HTMLCanvasElement>('canvas');

    await new Promise((resolve) => requestAnimationFrame(resolve));

    for (const layer of videos) {
      this.drawStageLayer(context, layer, bounds);
    }

    for (const layer of canvases) {
      this.drawStageLayer(context, layer, bounds);
    }

    return await new Promise<Blob>((resolve, reject) => {
      output.toBlob((blob) => {
        if (!blob) {
          reject(new Error('無法輸出截圖。'));
          return;
        }

        resolve(blob);
      }, 'image/png');
    });
  }

  private drawStageLayer(
    context: CanvasRenderingContext2D,
    layer: HTMLVideoElement | HTMLCanvasElement,
    stageBounds: DOMRect
  ): void {
    const bounds = layer.getBoundingClientRect();
    const x = bounds.left - stageBounds.left;
    const y = bounds.top - stageBounds.top;

    try {
      context.drawImage(layer, x, y, bounds.width, bounds.height);
    } catch {
      // Some WebGL frames cannot be captured on every browser. Keep the camera capture usable.
    }
  }

  private assertSingleTargetSet(activeExhibits: Exhibit[]): void {
    const [firstExhibit] = activeExhibits;
    const mismatchedExhibit = activeExhibits.find((exhibit) => exhibit.target !== firstExhibit.target);

    if (mismatchedExhibit) {
      throw new Error(`多素材自動判斷需要共用同一個 .mind target set，目前 ${mismatchedExhibit.name} 指向 ${mismatchedExhibit.target}。`);
    }
  }

  private setStageCopy(
    state: StageState,
    title: string,
    body: string,
    updateDom = true
  ): void {
    this.stageState = state;
    this.stageCopy = { title, body };

    if (!updateDom) {
      return;
    }

    const frame = this.root.querySelector<HTMLElement>('[data-stage-state]');
    const titleElement = this.root.querySelector<HTMLElement>('[data-stage-title]');
    const bodyElement = this.root.querySelector<HTMLElement>('[data-stage-body]');

    if (frame) {
      frame.dataset.stageState = state;
    }

    if (titleElement) {
      titleElement.textContent = title;
    }

    if (bodyElement) {
      bodyElement.textContent = body;
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return '請確認相機權限、target 檔案與素材路徑。';
  }
}

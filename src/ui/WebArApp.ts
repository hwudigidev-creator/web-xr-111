import { MindArSession } from '../ar/MindArSession';
import { verifyAssetFile, verifyTargetFile } from '../ar/assetChecks';
import { verifyCameraAccess } from '../ar/cameraAccess';
import { exhibits } from '../config/exhibits';
import type { Exhibit } from '../types/exhibit';
import { escapeHtml } from './escape';

type StageState = 'idle' | 'loading' | 'scanning' | 'found' | 'lost' | 'error';

interface StageCopy {
  title: string;
  body: string;
}

const readyExhibits = exhibits.filter((exhibit) => exhibit.isAssetReady);

export class WebArApp {
  private isStarting = false;
  private isRunning = false;
  private stageState: StageState = 'idle';
  private stageCopy: StageCopy = {
    title: '開始進行除錯...',
    body: ''
  };

  constructor(private readonly root: HTMLElement) {}

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
    this.root.innerHTML = `
      <main class="debug-start">
        <button class="debug-start-button" type="button" data-debug-start>
          <span>展場主題</span>
          <strong>開始進行除錯...</strong>
        </button>
      </main>
    `;

    this.root.querySelector<HTMLButtonElement>('[data-debug-start]')?.addEventListener('click', () => {
      void this.startDebug();
    });
  }

  private renderScanner(): void {
    this.root.innerHTML = `
      <main class="debug-scanner" data-stage-state="${this.stageState}">
        <div class="debug-ar-stage" data-ar-stage></div>
        <div class="debug-status" aria-live="polite">
          <strong data-stage-title>${escapeHtml(this.stageCopy.title)}</strong>
          <span data-stage-body>${escapeHtml(this.stageCopy.body)}</span>
        </div>
      </main>
    `;
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

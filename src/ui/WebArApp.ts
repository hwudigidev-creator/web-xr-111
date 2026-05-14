import { MindArSession } from '../ar/MindArSession';
import { exhibits } from '../config/exhibits';
import { resolvePublicPath } from '../config/paths';
import type { Exhibit } from '../types/exhibit';
import { escapeHtml } from './escape';
import { renderFallbackPreview } from './FallbackPreview';

type AppMode = 'scanner' | 'fallback';
type StageState = 'idle' | 'loading' | 'scanning' | 'found' | 'lost' | 'error';

interface StageCopy {
  title: string;
  body: string;
}

export class WebArApp {
  private mode: AppMode = 'scanner';
  private selectedExhibitId = exhibits[0]?.id ?? '';
  private session?: MindArSession;
  private isStarting = false;
  private isRunning = false;
  private stageState: StageState = 'idle';
  private stageCopy: StageCopy = {
    title: '準備掃描',
    body: '選擇 target 後啟動相機。'
  };

  constructor(private readonly root: HTMLElement) {}

  mount(): void {
    this.render();
  }

  private get selectedExhibit(): Exhibit {
    const exhibit = exhibits.find((item) => item.id === this.selectedExhibitId);

    if (!exhibit) {
      throw new Error(`Unknown exhibit id: ${this.selectedExhibitId}`);
    }

    return exhibit;
  }

  private render(): void {
    this.root.innerHTML = `
      <main class="app-shell">
        <header class="topbar">
          <div>
            <p class="app-label">WebAR Exhibition</p>
            <h1>展場互動掃描</h1>
          </div>
          <div class="mode-switch" role="group" aria-label="模式切換">
            ${this.renderModeButton('scanner', '掃描')}
            ${this.renderModeButton('fallback', '預覽')}
          </div>
        </header>
        ${this.mode === 'scanner' ? this.renderScanner() : renderFallbackPreview(exhibits)}
      </main>
    `;

    this.bindEvents();
  }

  private renderModeButton(mode: AppMode, label: string): string {
    const isActive = this.mode === mode;

    return `
      <button
        class="mode-button"
        type="button"
        data-mode="${mode}"
        aria-pressed="${isActive}"
      >
        ${label}
      </button>
    `;
  }

  private renderScanner(): string {
    const exhibit = this.selectedExhibit;

    return `
      <section class="scanner-layout">
        <aside class="target-panel" aria-label="target list">
          <div class="section-heading compact">
            <div>
              <p class="section-kicker">Targets</p>
              <h2>展區素材</h2>
            </div>
          </div>
          <div class="target-list">
            ${exhibits.map((item) => this.renderTargetButton(item)).join('')}
          </div>
        </aside>

        <section class="scanner-stage" aria-label="scanner">
          <div class="stage-toolbar">
            <div>
              <span class="zone-label">Zone ${escapeHtml(exhibit.zone)}</span>
              <h2>${escapeHtml(exhibit.name)}</h2>
            </div>
            <div class="toolbar-actions">
              <button class="secondary-button" type="button" data-stop ${this.isRunning ? '' : 'disabled'}>
                停止
              </button>
              <button class="primary-button" type="button" data-start ${this.isStarting || this.isRunning ? 'disabled' : ''}>
                ${this.isStarting ? '啟動中' : '啟動相機'}
              </button>
            </div>
          </div>

          <div class="ar-frame" data-stage-state="${this.stageState}">
            <div class="ar-canvas" data-ar-stage></div>
            <div class="stage-overlay" aria-live="polite">
              <div class="reticle" aria-hidden="true"></div>
              <div class="stage-status">
                <strong data-stage-title>${escapeHtml(this.stageCopy.title)}</strong>
                <span data-stage-body>${escapeHtml(this.stageCopy.body)}</span>
              </div>
            </div>
          </div>

          <div class="target-detail">
            <img src="${resolvePublicPath(exhibit.preview ?? exhibit.asset)}" alt="${escapeHtml(exhibit.name)} target preview" />
            <dl>
              <div>
                <dt>類型</dt>
                <dd>${escapeHtml(exhibit.type.toUpperCase())}</dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>${escapeHtml(exhibit.target)}</dd>
              </div>
              <div>
                <dt>素材</dt>
                <dd>${escapeHtml(exhibit.asset)}</dd>
              </div>
            </dl>
          </div>
        </section>
      </section>
    `;
  }

  private renderTargetButton(exhibit: Exhibit): string {
    const isSelected = exhibit.id === this.selectedExhibitId;

    return `
      <button
        class="target-button"
        type="button"
        data-target-id="${escapeHtml(exhibit.id)}"
        aria-pressed="${isSelected}"
      >
        <img src="${resolvePublicPath(exhibit.preview ?? exhibit.asset)}" alt="" loading="lazy" />
        <span>
          <strong>${escapeHtml(exhibit.name)}</strong>
          <small>${escapeHtml(exhibit.type.toUpperCase())}</small>
        </span>
      </button>
    `;
  }

  private bindEvents(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        const mode = button.dataset.mode as AppMode;
        void this.switchMode(mode);
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-target-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const targetId = button.dataset.targetId;

        if (targetId) {
          void this.selectTarget(targetId);
        }
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-scan-target]').forEach((button) => {
      button.addEventListener('click', () => {
        const targetId = button.dataset.scanTarget;

        if (targetId) {
          void this.selectTarget(targetId, 'scanner');
        }
      });
    });

    this.root.querySelector<HTMLButtonElement>('[data-start]')?.addEventListener('click', () => {
      void this.startScanner();
    });

    this.root.querySelector<HTMLButtonElement>('[data-stop]')?.addEventListener('click', () => {
      void this.stopScanner();
    });
  }

  private async switchMode(mode: AppMode): Promise<void> {
    if (this.mode === mode) {
      return;
    }

    await this.stopScanner();
    this.mode = mode;
    this.render();
  }

  private async selectTarget(targetId: string, nextMode: AppMode = this.mode): Promise<void> {
    if (targetId === this.selectedExhibitId && nextMode === this.mode) {
      return;
    }

    await this.stopScanner();
    this.selectedExhibitId = targetId;
    this.mode = nextMode;
    this.setStageCopy('idle', '準備掃描', '選擇 target 後啟動相機。', false);
    this.render();
  }

  private async startScanner(): Promise<void> {
    if (this.isStarting || this.isRunning) {
      return;
    }

    const stage = this.root.querySelector<HTMLElement>('[data-ar-stage]');

    if (!stage) {
      return;
    }

    this.isStarting = true;
    this.syncControls();
    this.setStageCopy('loading', '載入 AR 場景', '正在讀取 target 與素材。');

    const exhibit = this.selectedExhibit;
    const session = new MindArSession(stage, exhibit, {
      onReady: () => {
        this.isStarting = false;
        this.isRunning = true;
        this.syncControls();
        this.setStageCopy('scanning', '掃描中', `請對準 ${exhibit.name}。`);
      },
      onFound: () => {
        this.setStageCopy('found', '已定位', `${exhibit.name} 內容顯示中。`);
      },
      onLost: () => {
        this.setStageCopy('lost', 'Target 遺失', '重新對準展場圖像。');
      }
    });

    this.session = session;

    try {
      await session.start();
    } catch (error) {
      this.isStarting = false;
      this.isRunning = false;
      this.session = undefined;
      await session.stop();
      this.syncControls();
      this.setStageCopy('error', '無法啟動 AR', this.formatError(error));
    }
  }

  private async stopScanner(): Promise<void> {
    if (this.session) {
      const session = this.session;
      this.session = undefined;
      await session.stop();
    }

    this.isStarting = false;
    this.isRunning = false;
    this.setStageCopy('idle', '準備掃描', '選擇 target 後啟動相機。', false);
    this.syncControls();
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

  private syncControls(): void {
    const startButton = this.root.querySelector<HTMLButtonElement>('[data-start]');
    const stopButton = this.root.querySelector<HTMLButtonElement>('[data-stop]');

    if (startButton) {
      startButton.disabled = this.isStarting || this.isRunning;
      startButton.textContent = this.isStarting ? '啟動中' : '啟動相機';
    }

    if (stopButton) {
      stopButton.disabled = !this.isRunning;
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return '請確認相機權限、target 檔案與素材路徑。';
  }
}

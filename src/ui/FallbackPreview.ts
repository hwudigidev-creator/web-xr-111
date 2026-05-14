import { resolvePublicPath } from '../config/paths';
import type { Exhibit } from '../types/exhibit';
import { escapeHtml } from './escape';

export function renderFallbackPreview(exhibits: Exhibit[]): string {
  const cards = exhibits.map((exhibit) => renderFallbackCard(exhibit)).join('');

  return `
    <section class="fallback-view" aria-label="fallback preview">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Fallback</p>
          <h2>展區預覽</h2>
        </div>
        <p>相機不可用時，展場人員仍可檢查內容是否放對。</p>
      </div>
      <div class="preview-grid">
        ${cards}
      </div>
    </section>
  `;
}

function renderFallbackCard(exhibit: Exhibit): string {
  return `
    <article class="preview-card">
      <div class="preview-media">
        ${renderPreviewMedia(exhibit)}
      </div>
      <div class="preview-body">
        <div>
          <span class="zone-label">Zone ${escapeHtml(exhibit.zone)}</span>
          <h3>${escapeHtml(exhibit.name)}</h3>
        </div>
        <p>${renderAssetStatus(exhibit)}</p>
        <button class="text-button" type="button" data-scan-target="${escapeHtml(exhibit.id)}">
          掃描此 target
        </button>
      </div>
    </article>
  `;
}

function renderPreviewMedia(exhibit: Exhibit): string {
  const asset = resolvePublicPath(exhibit.asset);
  const preview = resolvePublicPath(exhibit.preview ?? exhibit.asset);
  const alt = escapeHtml(exhibit.name);

  if (exhibit.type === 'image') {
    return `<img src="${asset}" alt="${alt}" loading="lazy" />`;
  }

  if (exhibit.type === 'video' && exhibit.isAssetReady) {
    return `<video src="${asset}" controls muted playsinline preload="metadata" poster="${preview}"></video>`;
  }

  if (exhibit.type === 'model' && exhibit.isAssetReady) {
    return `
      <model-viewer
        src="${asset}"
        poster="${preview}"
        camera-controls
        touch-action="pan-y"
        alt="${alt}"
      ></model-viewer>
    `;
  }

  return `
    <div class="asset-placeholder">
      <img src="${preview}" alt="${alt}" loading="lazy" />
    </div>
  `;
}

function renderAssetStatus(exhibit: Exhibit): string {
  if (exhibit.isAssetReady) {
    return `${escapeHtml(exhibit.type.toUpperCase())} 素材已就緒`;
  }

  return `等待替換 ${escapeHtml(exhibit.asset)}`;
}

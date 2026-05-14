import { APP_VERSION } from './version';

const ABSOLUTE_URL_PATTERN = /^(https?:)?\/\//i;
const DATA_URL_PATTERN = /^data:/i;
const DRACO_DECODER_PATTERN = /\/draco\/?$/i;

export function resolvePublicPath(path: string): string {
  if (ABSOLUTE_URL_PATTERN.test(path) || DATA_URL_PATTERN.test(path)) {
    return path;
  }

  const cleanPath = path.replace(/^\/+/, '');
  const baseUrl = import.meta.env.BASE_URL || '/';
  const resolved = baseUrl === './'
    ? new URL(cleanPath, window.location.href).toString()
    : `${baseUrl.replace(/\/$/, '')}/${cleanPath}`;

  // DRACOLoader 會自行拼接 decoder 檔名，不能加 query
  if (DRACO_DECODER_PATTERN.test(resolved)) {
    return resolved;
  }

  return resolved.includes('?') ? resolved : `${resolved}?v=${APP_VERSION}`;
}

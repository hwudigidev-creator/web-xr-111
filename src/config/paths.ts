const ABSOLUTE_URL_PATTERN = /^(https?:)?\/\//i;
const DATA_URL_PATTERN = /^data:/i;

export function resolvePublicPath(path: string): string {
  if (ABSOLUTE_URL_PATTERN.test(path) || DATA_URL_PATTERN.test(path)) {
    return path;
  }

  const cleanPath = path.replace(/^\/+/, '');
  const baseUrl = import.meta.env.BASE_URL || '/';

  if (baseUrl === './') {
    return new URL(cleanPath, window.location.href).toString();
  }

  return `${baseUrl.replace(/\/$/, '')}/${cleanPath}`;
}

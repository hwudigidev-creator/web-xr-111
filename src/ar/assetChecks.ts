import { resolvePublicPath } from '../config/paths';
import type { Exhibit } from '../types/exhibit';

export async function verifyTargetFile(exhibit: Exhibit): Promise<void> {
  const url = resolvePublicPath(exhibit.target);
  const response = await fetch(url, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`找不到 target 檔：${exhibit.target}。請先上傳對應的 .mind 檔。`);
  }
}

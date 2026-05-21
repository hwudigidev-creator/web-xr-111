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

export async function verifyAssetFile(exhibit: Exhibit): Promise<void> {
  // 有 assetVariants 時把每張變體都驗一次，避免「主檔在但變體 404」的情況
  // 拖到 createContent 才爆炸。
  const paths = exhibit.type === 'model'
    && exhibit.assetVariants
    && exhibit.assetVariants.length > 0
      ? exhibit.assetVariants
      : [exhibit.asset];

  for (const path of paths) {
    const url = resolvePublicPath(path);
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`找不到素材檔：${path}。請先上傳對應的素材。`);
    }
  }
}

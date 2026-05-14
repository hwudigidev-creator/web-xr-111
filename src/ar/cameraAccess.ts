export async function verifyCameraAccess(): Promise<void> {
  if (!window.isSecureContext) {
    throw new Error('相機只能在 HTTPS 或 localhost 啟用，請確認目前網址是 https://。');
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('此瀏覽器不支援相機 API，請改用 Android Chrome 或 iOS Safari。');
  }

  let stream: MediaStream | undefined;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
  } catch (error) {
    throw new Error(formatCameraError(error));
  } finally {
    stream?.getTracks().forEach((track) => track.stop());
  }
}

function formatCameraError(error: unknown): string {
  if (!(error instanceof DOMException)) {
    return '相機啟動失敗，請確認瀏覽器與系統相機權限。';
  }

  if (error.name === 'NotAllowedError') {
    return '相機權限被拒絕，請到瀏覽器網址列或系統設定允許此網站使用相機。';
  }

  if (error.name === 'NotFoundError') {
    return '找不到可用相機，請確認裝置有相機且未被其他 App 佔用。';
  }

  if (error.name === 'NotReadableError') {
    return '相機目前無法讀取，請關閉其他正在使用相機的 App 後再試。';
  }

  if (error.name === 'OverconstrainedError') {
    return '裝置不支援指定的相機條件，請改用另一台手機或更新瀏覽器。';
  }

  return `相機啟動失敗：${error.message || error.name}`;
}

import '@google/model-viewer';
import './styles.css';
import { WebArApp } from './ui/WebArApp';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Missing #app root element.');
}

const app = new WebArApp(root);
app.mount();

if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => {
      console.warn('Service worker registration failed.', error);
    });
  });
}

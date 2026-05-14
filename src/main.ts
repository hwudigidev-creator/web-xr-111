import '@google/model-viewer';
import './styles.css';
import { WebArApp } from './ui/WebArApp';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Missing #app root element.');
}

const app = new WebArApp(root);
app.mount();

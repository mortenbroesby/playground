import { createRoot, type Root } from 'react-dom/client';
import { App } from './App';

export function mount(target: HTMLElement): () => void {
  const root: Root = createRoot(target);
  root.render(<App />);
  return () => root.unmount();
}

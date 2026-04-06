import type { TodoStore } from './store';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';
import { TodoStats } from './components/TodoStats';
import './index.css';

export function App({ store }: { store: TodoStore }) {
  return (
    <div className='terminal-scrollbars h-full space-y-5 p-0'>
      <section className='terminal-item rounded-md p-4 sm:p-5'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <p className='chrome-label text-primary'>Signal Intake</p>
            <h3 className='terminal-heading mt-2 text-lg text-foreground'>Queue a new task</h3>
          </div>
          <span className='signal-badge signal-badge--primary'>local store</span>
        </div>
        <TodoInput store={store} />
      </section>

      <section className='terminal-item rounded-md p-4 sm:p-5'>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <div>
            <p className='chrome-label'>Task Feed</p>
            <h3 className='terminal-heading mt-2 text-lg text-foreground'>Tracked items</h3>
          </div>
          <span className='signal-badge signal-badge--accent'>live sync</span>
        </div>
        <TodoList store={store} />
      </section>

      <section className='terminal-item rounded-md p-4 sm:p-5'>
        <p className='chrome-label'>Inspector</p>
        <TodoStats store={store} />
      </section>
    </div>
  );
}

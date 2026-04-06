import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';
import { TodoStats } from './components/TodoStats';
import './index.css';

export function App() {
  return (
    <div className='space-y-4 p-4'>
      <TodoInput />
      <TodoList />
      <TodoStats />
    </div>
  );
}

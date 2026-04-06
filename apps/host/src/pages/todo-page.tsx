import { TodoWorkspace } from '@/components/todo-workspace';

export function TodoPage() {
  return (
    <div className="p-6">
      <h1 className="text-slate-400 text-xs uppercase tracking-wider mb-4">Todo</h1>
      <TodoWorkspace />
    </div>
  );
}

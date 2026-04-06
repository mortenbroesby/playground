import { MfeFrame } from '@/components/mfe-frame';

export default function TodoPage() {
  return (
    <div className="p-6">
      <h1 className="text-slate-400 text-xs uppercase tracking-wider mb-4">Todo</h1>
      <MfeFrame remoteUrl="http://localhost:3101/remoteEntry.js" />
    </div>
  );
}

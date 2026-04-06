'use client';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">Something went wrong</h2>
      <p className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-md px-4 py-3">
        {error.message}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm rounded-md border border-slate-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

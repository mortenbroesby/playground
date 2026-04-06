import { readFileSync } from 'fs';
import { join } from 'path';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

export default function ReadmePage() {
  const readme = readFileSync(join(process.cwd(), '../../README.md'), 'utf-8');

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-slate-400 text-xs uppercase tracking-wider mb-6">README</h1>
      <article className="prose prose-invert prose-slate max-w-none">
        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
          {readme}
        </ReactMarkdown>
      </article>
    </div>
  );
}

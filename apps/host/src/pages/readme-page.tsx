import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import readme from '../../../../README.md?raw';

export function ReadmePage() {
  return (
    <div data-testid="readme-page" className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-slate-400 text-xs uppercase tracking-wider mb-4">README</h1>
      <article data-testid="readme-article" className="prose prose-invert prose-slate max-w-none">
        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{readme}</ReactMarkdown>
      </article>
    </div>
  );
}

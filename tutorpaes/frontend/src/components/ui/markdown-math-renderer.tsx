import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

interface MarkdownMathRendererProps {
  content: string;
  className?: string;
}

export function MarkdownMathRenderer({ content, className }: MarkdownMathRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 list-disc pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal pl-6">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          code: ({ children }) => (
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-900">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
              {children}
            </pre>
          ),
          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
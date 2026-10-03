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
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 list-disc pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal pl-6">{children}</ol>,
          li: ({ children }) => <li className="mb-0.5">{children}</li>,
          code: ({ children }) => (
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-brand-primary font-mono">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-lg bg-surface-base p-3 text-xs text-zinc-200 border border-white/5">
              {children}
            </pre>
          ),
          strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
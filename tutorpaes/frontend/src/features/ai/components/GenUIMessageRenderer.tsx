import { MarkdownMathRenderer } from '@/src/components/ui/markdown-math-renderer';
import { parseGenUISegments } from '../widgets/genui-parser';
import { WIDGET_REGISTRY, WidgetSkeleton } from '../widgets/WidgetRegistry';

interface GenUIMessageRendererProps {
  content: string;
  className?: string;
}

export function GenUIMessageRenderer({ content, className }: GenUIMessageRendererProps) {
  const segments = parseGenUISegments(content);

  if (segments.length === 1 && segments[0].type === 'text') {
    return <MarkdownMathRenderer content={segments[0].content} className={className} />;
  }

  return (
    <div className={className}>
      {segments.map((segment, i) => {
        if (segment.type === 'text') {
          return <MarkdownMathRenderer key={i} content={segment.content} />;
        }
        if (segment.type === 'widget-streaming') {
          return <WidgetSkeleton key={i} name={segment.name} />;
        }
        const WidgetComponent = WIDGET_REGISTRY[segment.name];
        if (!WidgetComponent) {
          return <WidgetSkeleton key={i} name={segment.name} unknown />;
        }
        return <WidgetComponent key={i} {...segment.args} />;
      })}
    </div>
  );
}

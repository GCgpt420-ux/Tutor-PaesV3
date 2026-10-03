// Lexer de marcadores GenUI. Ver docs/architecture/GENERATIVE_UI_SPECIFICATION.md.

export const WIDGET_COMPLETE_REGEX = /\[WIDGET:([A-Za-z0-9_-]+)\|([^\]]*)\]/g;
export const WIDGET_STREAMING_REGEX = /\[WIDGET:([A-Za-z0-9_-]*)(?:\|([^\]]*))?$/;

export type WidgetArgs = Record<string, string | number | boolean>;

export function parseWidgetArgs(rawArgs: string): WidgetArgs {
  const trimmed = rawArgs.trim();
  if (!trimmed) return {};

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fallback a query params
    }
  }

  const normalized = trimmed.replace(/;/g, '&');
  const params = new URLSearchParams(normalized);
  const result: WidgetArgs = {};

  params.forEach((value, key) => {
    const valTrim = value.trim();
    if (valTrim === 'true') result[key] = true;
    else if (valTrim === 'false') result[key] = false;
    else if (valTrim !== '' && !isNaN(Number(valTrim))) result[key] = Number(valTrim);
    else result[key] = valTrim;
  });

  return result;
}

export type GenUISegment =
  | { type: 'text'; content: string }
  | { type: 'widget'; name: string; args: WidgetArgs }
  | { type: 'widget-streaming'; name: string };

export function parseGenUISegments(content: string): GenUISegment[] {
  if (!content.includes('[WIDGET:')) {
    return [{ type: 'text', content }];
  }

  const streamingMatch = content.match(WIDGET_STREAMING_REGEX);
  const completePart = streamingMatch ? content.slice(0, streamingMatch.index) : content;

  const segments: GenUISegment[] = [];
  let lastIndex = 0;
  const regex = new RegExp(WIDGET_COMPLETE_REGEX);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(completePart)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: completePart.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'widget', name: match[1], args: parseWidgetArgs(match[2] ?? '') });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < completePart.length) {
    segments.push({ type: 'text', content: completePart.slice(lastIndex) });
  }

  if (streamingMatch) {
    segments.push({ type: 'widget-streaming', name: streamingMatch[1] || '' });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content }];
}

export function cleanTextForSpeech(rawContent: string): string {
  return rawContent
    .replace(/\[WIDGET:[^\]]*\]/g, '')
    .replace(/\[WIDGET:[^\]]*$/g, '')
    .trim();
}

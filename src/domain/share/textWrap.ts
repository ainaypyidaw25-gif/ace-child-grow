// Greedy text-wrapping for the milestone share card. Pure — takes a
// `measureWidth` callback instead of a CanvasRenderingContext2D so it can be
// unit tested without a canvas polyfill; src/lib/shareCard.ts wires it up to
// `ctx.measureText(...).width`.
//
// Splitting only on spaces (the naive approach) silently fails for Myanmar
// script: a Myanmar sentence is typically one unbroken run of glyphs with no
// inter-word spaces, so the whole phrase becomes a single "word" that never
// wraps and instead overflows past the card edge. This falls back to
// splitting a too-wide token at grapheme-cluster boundaries (via
// Intl.Segmenter where available) so long unspaced runs still wrap.

function graphemes(text: string): string[] {
  const SegmenterCtor = (Intl as typeof Intl & {
    Segmenter?: new (locale?: string, options?: { granularity: string }) => {
      segment(input: string): Iterable<{ segment: string }>;
    };
  }).Segmenter;
  if (SegmenterCtor) {
    const segmenter = new SegmenterCtor(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

function splitLongToken(token: string, maxWidth: number, measureWidth: (text: string) => number): string[] {
  const chunks: string[] = [];
  let chunk = '';
  for (const grapheme of graphemes(token)) {
    const candidate = chunk + grapheme;
    if (chunk && measureWidth(candidate) > maxWidth) {
      chunks.push(chunk);
      chunk = grapheme;
    } else {
      chunk = candidate;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

/**
 * Wraps `text` to `maxWidth`, breaking on spaces first and falling back to
 * grapheme-level splitting for any single "word" that is itself wider than
 * `maxWidth` (the common case for space-free Myanmar text).
 */
export function wrapText(text: string, maxWidth: number, measureWidth: (text: string) => number): string[] {
  const words = text.split(' ').filter((word) => word.length > 0);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measureWidth(candidate) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) {
      lines.push(line);
      line = '';
    }
    if (measureWidth(word) <= maxWidth) {
      line = word;
    } else {
      const pieces = splitLongToken(word, maxWidth, measureWidth);
      lines.push(...pieces.slice(0, -1));
      line = pieces[pieces.length - 1] ?? '';
    }
  }
  if (line) lines.push(line);
  return lines;
}

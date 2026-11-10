/**
 * Turns a case study's plain-text body into typed blocks. The CMS stores
 * plain text, so the format stays deliberately small:
 *   "## Heading" / "### Subheading", "- item" lists, one paragraph per line
 *   (the previous renderer used white-space: pre-line, so a single line break
 *   already read as a new paragraph).
 * Anything else renders as a paragraph; no HTML is ever interpreted.
 */

export type CaseStudyBlock =
  | { type: 'heading'; level: 2 | 3; text: string; id: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function parseCaseStudy(body: string): CaseStudyBlock[] {
  const blocks: CaseStudyBlock[] = [];
  const usedIds = new Set<string>();
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: 'list', items: list });
    list = [];
  };

  for (const rawLine of body.replace(/\r\n/g, '\n').split('\n')) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const text = heading[2].trim();
      let id = slugify(text) || 'section';
      for (let n = 2; usedIds.has(id); n++) id = `${slugify(text)}-${n}`;
      usedIds.add(id);
      blocks.push({ type: 'heading', level: heading[1].length === 3 ? 3 : 2, text, id });
      continue;
    }

    const item = line.match(/^[-*•]\s+(.*)$/);
    if (item) {
      flushParagraph();
      list.push(item[1]);
      continue;
    }

    flushList();
    paragraph.push(line);
    flushParagraph();
  }

  flushParagraph();
  flushList();
  return blocks;
}

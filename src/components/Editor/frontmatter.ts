import { tags } from '@lezer/highlight';
import type { BlockContext, Line } from '@lezer/markdown';

/**
 * Markdown extension that recognizes YAML frontmatter blocks
 * (content between opening --- and closing --- at the top of the file).
 *
 * Uses @lezer/markdown's extension points: defineNodes + parseBlock.
 */
export const frontmatterSupport = {
  defineNodes: [
    { name: 'FrontMatter', block: true, style: tags.meta },
    { name: 'FrontMatterMarker', style: tags.processingInstruction },
  ],
  parseBlock: [
    {
      name: 'FrontMatter',
      before: 'HorizontalRule',
      parse(cx: BlockContext, line: Line) {
        // Frontmatter must start at the very beginning of the document
        if (cx.lineStart !== 0) return false;

        // Must start with ---
        if (line.text.trim() !== '---') return false;

        const start = cx.lineStart;
        // Mark opening delimiter
        cx.addElement(
          cx.elt('FrontMatterMarker', start, start + line.text.length)
        );

        // Advance past lines until we find the closing ---
        while (cx.nextLine()) {
          if (line.text.trim() === '---') {
            const markerStart = cx.lineStart;
            // Add closing delimiter
            cx.addElement(
              cx.elt('FrontMatterMarker', markerStart, markerStart + line.text.length)
            );
            // Create the wrapping FrontMatter node
            cx.addElement(
              cx.elt('FrontMatter', start, markerStart + line.text.length)
            );
            cx.nextLine();
            return true;
          }
        }

        // If we reach EOF without closing ---, don't treat as frontmatter
        return false;
      },
    },
  ],
};

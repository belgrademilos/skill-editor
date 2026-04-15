/**
 * Rough GPT-style token estimate (~4 characters per token for English prose).
 */
export function getTokenCount(content: string): number {
  const n = content.length;
  return n === 0 ? 0 : Math.ceil(n / 4);
}

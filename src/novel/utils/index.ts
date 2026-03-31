import type { Editor } from "@tiptap/core";

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getUrlFromString(str: string) {
  if (isValidUrl(str)) return str;
  try {
    if (str.includes(".") && !str.includes(" ")) {
      return new URL(`https://${str}`).toString();
    }
  } catch {
    return null;
  }
}

export const getAllContent = (editor: Editor) => {
  const fragment = editor.state.doc.content;
  const doc = editor.state.doc.copy(fragment);
  // tiptap-markdown stores the serializer in editor.storage.markdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage = editor.storage as any;
  return storage.markdown.serializer.serialize(doc) as string;
};
